import pandas as pd
import json
import sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

PROC_DIR = Path(__file__).parent.parent / "data" / "processed"
CLEAN_DIR = PROC_DIR / "clean"
CLEAN_DIR.mkdir(parents=True, exist_ok=True)

def load(name):
    with open(PROC_DIR / f"{name}.json", encoding="utf-8") as f:
        return pd.DataFrame(json.load(f))

def save(df, name):
    out = CLEAN_DIR / f"{name}.json"
    df.to_json(out, orient="records", date_format="iso", indent=2, force_ascii=False)
    print(f"  {name}: {len(df)} rows -> {out.name}")

# City -> Country lookup (European cities in dataset)
CITY_COUNTRY = {
    "Amsterdam": "Netherlands", "Rotterdam": "Netherlands", "The Hague": "Netherlands",
    "Berlin": "Germany", "Munich": "Germany", "Frankfurt": "Germany", "Hamburg": "Germany",
    "Dusseldorf": "Germany", "Cologne": "Germany",
    "Paris": "France", "Lyon": "France", "Marseille": "France", "Nice": "France",
    "London": "United Kingdom", "Manchester": "United Kingdom", "Birmingham": "United Kingdom",
    "Edinburgh": "United Kingdom", "Glasgow": "United Kingdom", "Leeds": "United Kingdom",
    "Madrid": "Spain", "Barcelona": "Spain", "Seville": "Spain", "Valencia": "Spain",
    "Bilbao": "Spain",
    "Rome": "Italy", "Milan": "Italy", "Naples": "Italy", "Turin": "Italy", "Florence": "Italy",
    "Warsaw": "Poland", "Krakow": "Poland", "Wroclaw": "Poland", "Poznan": "Poland",
    "Prague": "Czech Republic", "Brno": "Czech Republic",
    "Vienna": "Austria", "Graz": "Austria",
    "Brussels": "Belgium", "Antwerp": "Belgium", "Ghent": "Belgium",
    "Zurich": "Switzerland", "Geneva": "Switzerland", "Basel": "Switzerland", "Bern": "Switzerland",
    "Stockholm": "Sweden", "Gothenburg": "Sweden", "Malmo": "Sweden",
    "Oslo": "Norway", "Bergen": "Norway",
    "Copenhagen": "Denmark", "Aarhus": "Denmark", "Aalborg": "Denmark",
    "Helsinki": "Finland", "Tampere": "Finland",
    "Lisbon": "Portugal", "Porto": "Portugal",
    "Dublin": "Ireland", "Cork": "Ireland", "Limerick": "Ireland",
    "Budapest": "Hungary", "Debrecen": "Hungary",
    "Bucharest": "Romania", "Cluj-Napoca": "Romania",
    "Sofia": "Bulgaria",
    "Athens": "Greece", "Thessaloniki": "Greece",
    "Zagreb": "Croatia",
    "Ljubljana": "Slovenia",
    "Bratislava": "Slovakia",
    "Tallinn": "Estonia",
    "Riga": "Latvia",
    "Vilnius": "Lithuania",
    "Luxembourg": "Luxembourg",
    "Nicosia": "Cyprus",
    "Valletta": "Malta",
    "Reykjavik": "Iceland",
    # Additional cities found in dataset
    "Eindhoven": "Netherlands", "Utrecht": "Netherlands",
    "Linköping": "Sweden", "Malmö": "Sweden",
    "Espoo": "Finland", "Turku": "Finland",
    "Esbjerg": "Denmark", "Odense": "Denmark",
    "Bruges": "Belgium",
    "Coimbra": "Portugal",
    "Miskolc": "Hungary",
    "Debrecen": "Hungary",
    "Constanta": "Romania", "Constanța": "Romania",
    "Iasi": "Romania", "Iași": "Romania",
    "Timisoara": "Romania", "Timișoara": "Romania",
    "Ostrava": "Czech Republic",
    "Salzburg": "Austria", "Linz": "Austria",
    "Lille": "France",
    "Liège": "Belgium",
    "Patras": "Greece",
}

def parse_dates(df, cols):
    for c in cols:
        if c in df.columns:
            df[c] = pd.to_datetime(df[c], dayfirst=True, errors="coerce")
    return df

# ── Projects ──────────────────────────────────────────────────────────────────
proj = load("projects")
print(f"\nProjects: {proj.shape}")
print("Columns:", proj.columns.tolist())

# Project_Country was fully dropped by parse_excel (all #VALUE!) — derive from City
proj["Project_Country"] = proj["City"].map(CITY_COUNTRY)
missing_country = proj["Project_Country"].isna().sum()
if missing_country:
    unmapped = proj.loc[proj['Project_Country'].isna(), 'City'].unique()
    print(f"  Cities without country mapping ({missing_country}):")
    for c in unmapped:
        print(f"    {c!r}")

proj = parse_dates(proj, ["PlannedStartDate", "PlannedEndDate", "ActualStartDate", "ActualEndDate"])

for col in ["Project_Country_Latitude", "Project_Country_Longitude"]:
    proj[col] = pd.to_numeric(proj[col], errors="coerce")

proj.rename(columns={
    "PlannedBudget (EUR)": "PlannedBudget",
    "ActualBudget (EUR)": "ActualBudget",
}, inplace=True)

save(proj, "projects")

# ── Tasks ─────────────────────────────────────────────────────────────────────
tasks = load("tasks")
print(f"\nTasks: {tasks.shape}")

tasks.rename(columns={"AssignedTo (EmployeeID)": "EmployeeID"}, inplace=True)
tasks["PlannedHours"] = pd.to_numeric(tasks["PlannedHours"], errors="coerce")
tasks["ActualHours"]  = pd.to_numeric(tasks["ActualHours"],  errors="coerce")
save(tasks, "tasks")

# ── Employees ─────────────────────────────────────────────────────────────────
emp = load("employees")
print(f"\nEmployees: {emp.shape}")

emp.rename(columns={"HourlyRate (EUR/hour)": "HourlyRate"}, inplace=True)
for col in ["Employee_Country_Latitude", "Employee_Country_Longitude"]:
    emp[col] = pd.to_numeric(emp[col], errors="coerce")
emp["HourlyRate"] = pd.to_numeric(emp["HourlyRate"], errors="coerce")
save(emp, "employees")

# ── Departments ───────────────────────────────────────────────────────────────
dept = load("departments")
print(f"\nDepartments: {dept.shape}")
save(dept, "departments")

# ── Milestones ────────────────────────────────────────────────────────────────
ms = load("milestones")
print(f"\nMilestones: {ms.shape}")
ms = parse_dates(ms, ["PlannedCompletionDate", "ActualCompletionDate"])
save(ms, "milestones")

# ── Flags ─────────────────────────────────────────────────────────────────────
flags = load("flags")
print(f"\nFlags: {flags.shape}")
save(flags, "flags")

print("\nDone - clean_data.py")
