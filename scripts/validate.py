#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
REQUIRED = ("name", "description")
PORTABLE_NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


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
                "lowercase-alphanumeric words separated by single hyphens (max 64 chars)"
            )
        if description and len(description) > 1024:
            errors.append(f"{skill_dir.name}: description exceeds 1024 characters")

    if errors:
        print("Validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Validated {len(skill_dirs)} portable skill(s) successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
