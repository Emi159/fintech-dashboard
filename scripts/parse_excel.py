import pandas as pd
import json
import os
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
OUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FINTECH_FILE = RAW_DIR / "Fintech Projects Dataset.xlsx"
FLAGS_FILE = RAW_DIR / "World Flags Dataset Addition.xlsx"

def df_to_json(df: pd.DataFrame, path: Path):
    df.to_json(path, orient="records", date_format="iso", indent=2, force_ascii=False)
    print(f"  Wrote {len(df)} rows -> {path.name}")

xl = pd.ExcelFile(FINTECH_FILE)
print("Sheets:", xl.sheet_names)

sheets = {
    "projects":    "Projects",
    "tasks":       "Tasks",
    "employees":   "Employees",
    "departments": "Departments",
    "milestones":  "Milestones",
}

for key, sheet in sheets.items():
    df = pd.read_excel(xl, sheet_name=sheet)
    # Drop fully-empty columns (trailing garbage in Employees sheet)
    df = df.dropna(axis=1, how="all")
    df_to_json(df, OUT_DIR / f"{key}.json")

# Flags sheet
xl_flags = pd.ExcelFile(FLAGS_FILE)
print("Flag sheets:", xl_flags.sheet_names)
df_flags = pd.read_excel(xl_flags, sheet_name=0)
df_flags = df_flags.dropna(axis=1, how="all")
df_to_json(df_flags, OUT_DIR / "flags.json")

print("Done — parse_excel.py")
