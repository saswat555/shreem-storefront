#!/usr/bin/env python3
"""
Export Flutter project sources into a single text file.

Run from the Flutter project root (shreem_storefront):
  python3 export_flutter_sources.py

Output:
  shreem_storefront_sources.txt

What it includes (by default):
- lib/**/*.dart
- pubspec.yaml
- analysis_options.yaml (if present)
- (Optional) android/app/build.gradle, ios/Runner/Info.plist, etc. if you enable EXTRA_FILES

What it excludes:
- build/, .dart_tool/, .idea/, .vscode/, .git/, node_modules/, etc.
"""

from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path.cwd()
OUTPUT_FILE = PROJECT_ROOT / "shreem_storefront_sources.txt"

# Files/folders to always exclude
EXCLUDE_DIRS = {
    ".dart_tool",
    "build",
    ".git",
    ".idea",
    ".vscode",
    ".flutter-plugins",
    ".flutter-plugins-dependencies",
    ".metadata",
    "ios/Pods",
    "ios/.symlinks",
    "android/.gradle",
    "android/build",
    "linux",
    "macos",
    "windows",
    "node_modules",
}

# Only include these by default
INCLUDE_GLOBS = [
    "lib/**/*.dart",
    "pubspec.yaml",
    "analysis_options.yaml",
    "README.md",
]

# Optional extra files for debugging platform setup (set to True if needed)
INCLUDE_EXTRA_PLATFORM_FILES = False
EXTRA_FILES = [
    "android/app/build.gradle",
    "android/app/src/main/AndroidManifest.xml",
    "ios/Runner/Info.plist",
    "web/index.html",
]

def is_excluded(path: Path) -> bool:
    # Exclude if any parent directory matches excluded dirs
    # Handle nested patterns like "ios/Pods"
    rel = path.relative_to(PROJECT_ROOT).as_posix()
    for ex in EXCLUDE_DIRS:
        ex_norm = ex.strip("/")

        # exact directory match or prefix match
        if rel == ex_norm or rel.startswith(ex_norm + "/"):
            return True
    return False

def read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        # Fallback for odd encodings
        return path.read_text(errors="replace")

def collect_files() -> list[Path]:
    files: list[Path] = []
    for pattern in INCLUDE_GLOBS:
        for p in PROJECT_ROOT.glob(pattern):
            if p.is_file() and not is_excluded(p):
                files.append(p)

    if INCLUDE_EXTRA_PLATFORM_FILES:
        for f in EXTRA_FILES:
            p = PROJECT_ROOT / f
            if p.exists() and p.is_file() and not is_excluded(p):
                files.append(p)

    # Deduplicate + sort
    files = sorted(set(files), key=lambda x: x.relative_to(PROJECT_ROOT).as_posix())
    return files

def main() -> None:
    if (PROJECT_ROOT / "pubspec.yaml").exists() is False:
        print("ERROR: pubspec.yaml not found. Run this from the Flutter project root.")
        raise SystemExit(1)

    files = collect_files()
    if not files:
        print("No files collected. Check INCLUDE_GLOBS / exclusions.")
        raise SystemExit(2)

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    header = [
        "SHREEM STOREFRONT SOURCE EXPORT",
        f"Generated: {now}",
        f"Project root: {PROJECT_ROOT.as_posix()}",
        "",
        "Included files:",
        *[f" - {p.relative_to(PROJECT_ROOT).as_posix()}" for p in files],
        "",
        "=" * 100,
        "",
    ]

    with OUTPUT_FILE.open("w", encoding="utf-8") as out:
        out.write("\n".join(header))

        for p in files:
            rel = p.relative_to(PROJECT_ROOT).as_posix()
            content = read_text_file(p)

            out.write(f"\n\n{'#' * 100}\n")
            out.write(f"# FILE: {rel}\n")
            out.write(f"{'#' * 100}\n\n")
            out.write(content.rstrip() + "\n")

    print(f"✅ Exported {len(files)} file(s) to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()