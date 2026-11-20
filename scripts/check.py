"""Static checker for layer boundaries, banned calls, dataclass rules, function length.

Run: python scripts/check.py   (exit code 1 on any violation)
"""
from __future__ import annotations

import ast
import sys
from pathlib import Path

PKG = "sdocx2obsidian"
SRC = Path(__file__).resolve().parent.parent / "src" / PKG
MAX_FUNC_LINES = 35
STDLIB = sys.stdlib_module_names

ALLOWED_INTERNAL: dict[str, set[str]] = {
    "domain": {"domain"},
    "core": {"domain", "core"},
    "infrastructure": {"domain", "infrastructure"},
    "application": {"domain", "application"},
    "web": {"domain", "core", "infrastructure", "application", "web"},
}
# Domain is allow-listed; other layers are "stdlib minus banned".
DOMAIN_STDLIB = {"dataclasses", "pathlib", "typing", "collections", "enum", "__future__"}
BANNED_STDLIB: dict[str, set[str]] = {
    "core": {"os", "sys", "zipfile", "logging", "shutil", "tempfile"},
    "application": {"os", "sys", "zipfile", "shutil", "tempfile"},
}
BANNED_CALLS: dict[str, set[str]] = {
    "domain": {"open", "print"},
    "core": {"open", "print"},
    "application": {"open", "print"},
    "infrastructure": {"print"},
    "web": {"print"},
}
BANNED_CORE_ATTRS = {
    "exists", "write_text", "read_text", "write_bytes", "read_bytes",
    "mkdir", "open", "is_file", "is_dir", "iterdir", "unlink",
}


def layer_of(path: Path) -> str | None:
    rel = path.relative_to(SRC)
    return rel.parts[0] if len(rel.parts) > 1 else ("cli" if rel.name == "cli.py" else None)


def resolve(node: ast.AST, path: Path) -> list[str]:
    if isinstance(node, ast.Import):
        return [a.name for a in node.names]
    assert isinstance(node, ast.ImportFrom)
    if node.level == 0:
        return [node.module or ""]
    pkg_parts = [PKG, *path.relative_to(SRC).parts[:-1]]
    base = pkg_parts[: len(pkg_parts) - (node.level - 1)]
    return [".".join([*base, *(node.module.split(".") if node.module else [])])]


def check_imports(path: Path, layer: str, tree: ast.AST) -> list[str]:
    errors: list[str] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.Import | ast.ImportFrom):
            continue
        for full in resolve(node, path):
            parts = full.split(".")
            if parts[0] == PKG:
                target = parts[1] if len(parts) > 1 else ""
                if target and target not in ALLOWED_INTERNAL[layer]:
                    errors.append(f"{path}:{node.lineno}: {layer}/ must not import {full}")
                continue
            top = parts[0]
            if layer == "domain" and top not in DOMAIN_STDLIB:
                errors.append(f"{path}:{node.lineno}: domain/ may not import '{top}'")
            elif top not in STDLIB:
                errors.append(f"{path}:{node.lineno}: third-party import '{top}' in {layer}/")
            elif top in BANNED_STDLIB.get(layer, set()):
                errors.append(f"{path}:{node.lineno}: '{top}' is forbidden in {layer}/")
    return errors


def check_calls(path: Path, layer: str, tree: ast.AST) -> list[str]:
    errors: list[str] = []
    banned = BANNED_CALLS.get(layer, set())
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if isinstance(func, ast.Name) and func.id in banned:
            errors.append(f"{path}:{node.lineno}: call to {func.id}() forbidden in {layer}/")
        if layer == "core" and isinstance(func, ast.Attribute) and func.attr in BANNED_CORE_ATTRS:
            errors.append(f"{path}:{node.lineno}: I/O-like call .{func.attr}() in core/")
    return errors


def _is_dataclass_ok(dec: ast.expr) -> bool:
    if not (isinstance(dec, ast.Call) and getattr(dec.func, "id", "") == "dataclass"):
        return False
    kw = {k.arg: getattr(k.value, "value", None) for k in dec.keywords}
    return kw.get("frozen") is True and kw.get("slots") is True


def check_dataclasses(path: Path, tree: ast.AST) -> list[str]:
    errors: list[str] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.ClassDef):
            continue
        for dec in node.decorator_list:
            is_dc = getattr(dec, "id", "") == "dataclass" or (
                isinstance(dec, ast.Call) and getattr(dec.func, "id", "") == "dataclass"
            )
            if is_dc and not _is_dataclass_ok(dec):
                errors.append(f"{path}:{node.lineno}: use @dataclass(frozen=True, slots=True)")
    return errors


def func_length(node: ast.FunctionDef | ast.AsyncFunctionDef) -> int:
    length = (node.end_lineno or node.lineno) - node.lineno + 1
    first = node.body[0]
    val = getattr(first, "value", None)
    if isinstance(val, ast.Constant) and isinstance(val.value, str):
        length -= (first.end_lineno or first.lineno) - first.lineno + 1
    return length


def check_function_length(path: Path, tree: ast.AST) -> list[str]:
    return [
        f"{path}:{n.lineno}: function '{n.name}' is {func_length(n)} lines (max {MAX_FUNC_LINES})"
        for n in ast.walk(tree)
        if isinstance(n, ast.FunctionDef | ast.AsyncFunctionDef) and func_length(n) > MAX_FUNC_LINES
    ]


def main() -> int:
    errors: list[str] = []
    for path in sorted(SRC.rglob("*.py")):
        layer = layer_of(path)
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        errors += check_function_length(path, tree)
        if layer in ALLOWED_INTERNAL:
            errors += check_imports(path, layer, tree)
            errors += check_calls(path, layer, tree)
        if layer == "domain":
            errors += check_dataclasses(path, tree)
    for line in errors:
        print(line)
    print(f"architecture check: {'FAILED' if errors else 'OK'} ({len(errors)} violation(s))")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
