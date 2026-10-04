#!/usr/bin/env python3
"""Privacy/read-time lint for a draft Medium article.

This is deliberately conservative: it flags suspicious material for human review.
It does not prove that a draft is safe to publish.

Usage:
  python article_lint.py article.md
  python article_lint.py article.md --denylist protected_terms.txt
  python article_lint.py article.md --wpm 220
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

PATTERNS = {
    "email": re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I),
    "ipv4": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "guid": re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b", re.I),
    "connection_string": re.compile(r"\b(?:Server|Data Source|Initial Catalog|User ID|Password|AccountKey)\s*=", re.I),
    "secret_like": re.compile(r"\b(?:api[_-]?key|secret|token|client[_-]?secret|password)\s*[:=]\s*[^\s,;]+", re.I),
    "ticket_id": re.compile(r"\b[A-Z][A-Z0-9]{1,9}-\d{2,8}\b"),
    "windows_path": re.compile(r"\b[A-Za-z]:\\(?:[^\s\\]+\\)*[^\s\\]*"),
    "unc_path": re.compile(r"\\\\[A-Za-z0-9._-]+\\[^\s]+"),
    "internalish_url": re.compile(r"https?://(?:localhost|127\.0\.0\.1|[A-Za-z0-9_-]+\.(?:local|internal|corp|lan))(?::\d+)?[^\s)]*", re.I),
}

PUBLIC_REFERENCE_HOSTS = {
    "learn.microsoft.com",
    "docs.github.com",
    "github.com",
    "github.blog",
    "dotnet.microsoft.com",
    "developer.mozilla.org",
    "owasp.org",
    "medium.com",
}

URL_RE = re.compile(r"https?://([^/\s)]+)(?:[^\s)]*)", re.I)
WORD_RE = re.compile(r"\b[\w’'-]+\b", re.UNICODE)


def line_number(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("article", type=Path)
    parser.add_argument("--denylist", type=Path)
    parser.add_argument("--wpm", type=int, default=210)
    args = parser.parse_args()

    text = args.article.read_text(encoding="utf-8")
    words = WORD_RE.findall(re.sub(r"```.*?```", " ", text, flags=re.S))
    minutes = len(words) / max(args.wpm, 1)

    print(f"Words (excluding fenced code): {len(words)}")
    print(f"Estimated prose read time @ {args.wpm} wpm: {minutes:.1f} min")
    if len(words) < 750:
        print("WARN: draft may be shorter than the target five-minute article.")
    elif len(words) > 1200:
        print("WARN: draft may be longer than the target five-minute article.")

    findings: list[tuple[int, str, str]] = []

    for label, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            findings.append((line_number(text, match.start()), label, match.group(0)[:120]))

    for match in URL_RE.finditer(text):
        host = match.group(1).lower().split(":", 1)[0]
        if host not in PUBLIC_REFERENCE_HOSTS and not any(host.endswith("." + h) for h in PUBLIC_REFERENCE_HOSTS):
            findings.append((line_number(text, match.start()), "review_url", match.group(0)[:120]))

    if args.denylist:
        terms = []
        for raw in args.denylist.read_text(encoding="utf-8").splitlines():
            term = raw.strip()
            if term and not term.startswith("#"):
                terms.append(term)
        for term in terms:
            for match in re.finditer(re.escape(term), text, re.I):
                findings.append((line_number(text, match.start()), "denylist", term))

    findings.sort(key=lambda x: (x[0], x[1], x[2]))

    if findings:
        print("\nPRIVACY/REVIEW FLAGS")
        for line, label, value in findings:
            print(f"  line {line:>4}  [{label}] {value}")
        print("\nReview every flag. This tool is advisory and cannot detect all confidential context.")
        return 2

    print("\nNo high-confidence privacy patterns found. Manual confidentiality review is still required.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
