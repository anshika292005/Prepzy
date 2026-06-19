"""Report source-language composition without generated or dependency files."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from backend.core.config import ROOT_DIR

EXTENSIONS = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript/React",
    ".sh": "Shell",
    ".yml": "YAML",
    ".yaml": "YAML",
}
EXCLUDED_PARTS = {
    "node_modules",
    ".next",
    ".venv-ml",
    "__pycache__",
    "dist",
    ".git",
}


def count_lines(path: Path) -> int:
    try:
        return sum(1 for _ in path.open("r", encoding="utf-8", errors="ignore"))
    except OSError:
        return 0


def source_files(root: Path = ROOT_DIR):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in EXCLUDED_PARTS for part in path.parts):
            continue
        if path.suffix in EXTENSIONS:
            yield path
        elif path.name.startswith("Dockerfile") or path.suffix == ".conf":
            yield path


def report(root: Path = ROOT_DIR) -> dict[str, dict[str, float]]:
    counts: defaultdict[str, int] = defaultdict(int)
    files: defaultdict[str, int] = defaultdict(int)
    for path in source_files(root):
        if path.name.startswith("Dockerfile"):
            language = "Docker"
        elif path.suffix == ".conf":
            language = "Infrastructure"
        else:
            language = EXTENSIONS[path.suffix]
        counts[language] += count_lines(path)
        files[language] += 1
    total = sum(counts.values()) or 1
    return {
        language: {
            "files": files[language],
            "lines": lines,
            "percentage": round(lines / total * 100, 2),
        }
        for language, lines in sorted(
            counts.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    }


def main() -> None:
    values = report()
    print(f"{'Language':<20} {'Files':>7} {'Lines':>9} {'Share':>9}")
    print("-" * 49)
    for language, metrics in values.items():
        print(
            f"{language:<20} "
            f"{metrics['files']:>7.0f} "
            f"{metrics['lines']:>9.0f} "
            f"{metrics['percentage']:>8.2f}%"
        )
    python_infra = sum(
        metrics["percentage"]
        for language, metrics in values.items()
        if language in {"Python", "Shell", "YAML", "Docker", "Infrastructure"}
    )
    print("-" * 49)
    print(f"{'Python + infrastructure':<37} {python_infra:>8.2f}%")


if __name__ == "__main__":
    main()
