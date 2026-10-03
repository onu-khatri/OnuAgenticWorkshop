#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
AGENTS = ROOT / "agents"
FORMATS = ROOT / "agent-formats.json"
REQUIRED = ("name", "description")
PORTABLE_NAME = re.compile(r"^onu-[a-z0-9]+(?:-[a-z0-9]+)*$")
PREFIX = "onu-"


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}
    block = text[4:end]
    data: dict[str, str] = {}
    for line in block.splitlines():
        match = re.match(r"^([A-Za-z0-9_-]+):\s*(.+?)\s*$", line)
        if match:
            data[match.group(1)] = match.group(2).strip().strip('"\'')
    return data


def _split_frontmatter(text: str) -> str:
    if not text.startswith("---\n"):
        return ""
    end = text.find("\n---\n", 4)
    if end == -1:
        return ""
    return text[4:end]


def _parse_scalar(rest: str):
    rest = rest.strip()
    if rest.startswith("[") and rest.endswith("]"):
        inner = rest[1:-1].strip()
        if not inner:
            return []
        return [_parse_scalar(item.strip()) for item in inner.split(",")]
    if len(rest) >= 2 and rest[0] in "\"'" and rest[-1] == rest[0]:
        return rest[1:-1]
    lowered = rest.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if lowered in ("null", "~"):
        return None
    if re.fullmatch(r"-?\d+", rest):
        return int(rest)
    if re.fullmatch(r"-?\d+\.\d+", rest):
        return float(rest)
    return rest


def _parse_block(lines: list[str], idx: int, indent: int):
    result: dict = {}
    while idx < len(lines):
        line = lines[idx]
        if not line.strip() or line.strip().startswith("#"):
            idx += 1
            continue
        stripped = line.lstrip(" ")
        cur_indent = len(line) - len(stripped)
        if cur_indent < indent:
            break
        if cur_indent > indent:
            idx += 1
            continue

        match = re.match(r"^([^:]+):(?:\s*(.*))?$", stripped)
        if not match:
            idx += 1
            continue

        key = match.group(1).strip()
        rest = match.group(2) or ""

        if rest.strip() == "":
            next_indent = None
            next_stripped = None
            if idx + 1 < len(lines):
                nxt = lines[idx + 1]
                next_stripped = nxt.lstrip(" ")
                next_indent = len(nxt) - len(next_stripped)
            if next_indent is not None and next_indent > indent and next_stripped.startswith("-"):
                items: list = []
                idx += 1
                while idx < len(lines):
                    nxt = lines[idx]
                    nxt_stripped = nxt.lstrip(" ")
                    nxt_indent = len(nxt) - len(nxt_stripped)
                    if nxt_indent < next_indent:
                        break
                    if nxt_stripped.startswith("-"):
                        items.append(_parse_scalar(nxt_stripped[1:].strip()))
                        idx += 1
                    elif not nxt_stripped:
                        idx += 1
                    else:
                        break
                result[key] = items
                continue
            if next_indent is not None and next_indent > indent:
                result[key], idx = _parse_block(lines, idx + 1, next_indent)
                continue
            result[key] = None
            idx += 1
            continue

        result[key] = _parse_scalar(rest)
        idx += 1
    return result, idx


def parse_yaml_frontmatter(text: str) -> dict:
    block = _split_frontmatter(text)
    if not block:
        return {}
    lines = block.splitlines()
    result, _ = _parse_block(lines, 0, 0)
    return result


def _field_error(errors: list[str], agent: str, key: str, message: str) -> None:
    errors.append(f"{agent}: field '{key}' {message}")


def _validate_field(errors: list[str], agent: str, key: str, val, spec: dict) -> None:
    kind = spec.get("type")
    if kind == "string":
        if not isinstance(val, str):
            _field_error(errors, agent, key, "must be a string")
            return
        if "maxLength" in spec and len(val) > spec["maxLength"]:
            _field_error(errors, agent, key, f"exceeds {spec['maxLength']} characters")
        if "pattern" in spec and not re.fullmatch(spec["pattern"], val):
            _field_error(errors, agent, key, "does not match required pattern")
        if "enum" in spec and val not in spec["enum"]:
            _field_error(errors, agent, key, f"must be one of {spec['enum']}")
    elif kind == "number":
        if isinstance(val, bool) or not isinstance(val, (int, float)):
            _field_error(errors, agent, key, "must be a number")
            return
        minimum = spec.get("min", spec.get("minimum"))
        maximum = spec.get("max", spec.get("maximum"))
        if minimum is not None and val < minimum:
            _field_error(errors, agent, key, f"must be >= {minimum}")
        if maximum is not None and val > maximum:
            _field_error(errors, agent, key, f"must be <= {maximum}")
    elif kind == "boolean":
        if not isinstance(val, bool):
            _field_error(errors, agent, key, "must be a boolean")
    elif kind == "array":
        if not isinstance(val, list):
            _field_error(errors, agent, key, "must be a list")
    elif kind == "object":
        if not isinstance(val, dict):
            _field_error(errors, agent, key, "must be an object")


def validate_agents(errors: list[str]) -> int:
    if not FORMATS.exists():
        errors.append("agent-formats.json not found")
        return 0

    try:
        schema = json.loads(FORMATS.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"agent-formats.json is invalid JSON: {exc}")
        return 0

    fields = schema.get("canonical", {}).get("fields", {})
    agent_dirs = sorted(p for p in AGENTS.iterdir() if p.is_dir()) if AGENTS.exists() else []
    if not agent_dirs:
        errors.append("agents/ contains no agent directories")
        return 0

    for agent_dir in agent_dirs:
        manifests = [p for p in agent_dir.rglob("*") if p.is_file() and p.name.lower() == "agent.md"]
        if len(manifests) != 1:
            errors.append(f"{agent_dir.name}: expected exactly one AGENT.md, found {len(manifests)}")
            continue

        manifest = manifests[0]
        if manifest.parent != agent_dir:
            errors.append(f"{agent_dir.name}: AGENT.md must be at the agent root")

        data = parse_yaml_frontmatter(manifest.read_text(encoding="utf-8"))

        for key in REQUIRED:
            if not data.get(key):
                errors.append(f"{agent_dir.name}: missing front matter field '{key}'")

        name = data.get("name", "")
        if name and name != agent_dir.name:
            errors.append(f"{agent_dir.name}: front matter name '{name}' must match directory name")
        if name and (len(name) > 64 or not PORTABLE_NAME.fullmatch(name)):
            errors.append(
                f"{agent_dir.name}: name must use the portable cross-client format "
                "'onu-' prefix followed by lowercase-alphanumeric words separated by single hyphens (max 64 chars)"
            )

        description = data.get("description", "")
        if description and isinstance(description, str) and len(description) > 1024:
            errors.append(f"{agent_dir.name}: description exceeds 1024 characters")

        for key, val in data.items():
            if val is None or key not in fields:
                continue
            _validate_field(errors, agent_dir.name, key, val, fields[key])

    return len(agent_dirs)


def main() -> int:
    errors: list[str] = []

    skill_dirs = sorted(p for p in SKILLS.iterdir() if p.is_dir()) if SKILLS.exists() else []
    if not skill_dirs:
        errors.append("skills/ contains no skill directories")

    for skill_dir in skill_dirs:
        manifests = [p for p in skill_dir.rglob("*") if p.is_file() and p.name.lower() == "skill.md"]
        if len(manifests) != 1:
            errors.append(f"{skill_dir.name}: expected exactly one SKILL.md, found {len(manifests)}")
            continue

        manifest = manifests[0]
        if manifest.parent != skill_dir:
            errors.append(f"{skill_dir.name}: SKILL.md must be at the skill root")

        data = parse_frontmatter(manifest.read_text(encoding="utf-8"))
        for key in REQUIRED:
            if not data.get(key):
                errors.append(f"{skill_dir.name}: missing front matter field '{key}'")

        name = data.get("name", "")
        description = data.get("description", "")
        if name and name != skill_dir.name:
            errors.append(f"{skill_dir.name}: front matter name '{name}' must match directory name")
        if name and (len(name) > 64 or not PORTABLE_NAME.fullmatch(name)):
            errors.append(
                f"{skill_dir.name}: name must use the portable cross-client format "
                "'onu-' prefix followed by lowercase-alphanumeric words separated by single hyphens (max 64 chars)"
            )
        if description and len(description) > 1024:
            errors.append(f"{skill_dir.name}: description exceeds 1024 characters")

    agent_count = validate_agents(errors)

    if errors:
        print("Validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Validated {len(skill_dirs)} portable skill(s) and {agent_count} agent(s) successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
