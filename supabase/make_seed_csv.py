import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_JS = ROOT / "site_supabase" / "data.js"
if not DATA_JS.exists():
    DATA_JS = ROOT / "v2" / "data.js"
OUT = ROOT / "outputs" / "supabase_library_records_seed.csv"


def main():
    text = DATA_JS.read_text(encoding="utf-8")
    match = re.search(r"window\.LIBRARY_DATA = (\[.*\]);\s*$", text, re.S)
    if not match:
        raise SystemExit("Could not parse site_supabase/data.js")
    records = json.loads(match.group(1))
    OUT.parent.mkdir(exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["id", "record"])
        writer.writeheader()
        for record in records:
            writer.writerow({
                "id": record["id"],
                "record": json.dumps(record, ensure_ascii=False, separators=(",", ":")),
            })
    print(OUT)
    print(f"records={len(records)}")


if __name__ == "__main__":
    main()
