"""
Generates realistic synthetic startup transaction data and POSTs to the API.

Usage:
    python scripts/seed.py                  # 200 transactions (default)
    python scripts/seed.py --count 500      # custom count
    python scripts/seed.py --url http://... # custom API URL
"""
import asyncio
import random
import argparse
from datetime import datetime, timedelta
import httpx

BASE_URL = "http://localhost:8000/api/v1/transactions"

MERCHANTS = [
    # (merchant_name, expected_category, amount_range_INR)
    ("AWS",                       "software",    (3_000,   40_000)),
    ("Google Cloud",              "software",    (2_000,   25_000)),
    ("GitHub",                    "software",    (2_000,    8_000)),
    ("Figma",                     "software",    (1_500,    5_000)),
    ("Notion",                    "software",    (800,      3_000)),
    ("Slack",                     "software",    (1_200,    6_000)),
    ("Zoom",                      "software",    (1_000,    4_000)),
    ("Razorpay",                  "software",    (500,      5_000)),
    ("DigitalOcean",              "software",    (1_500,   15_000)),
    ("Employee Salary - Eng",     "payroll",    (80_000,  220_000)),
    ("Employee Salary - Design",  "payroll",    (60_000,  150_000)),
    ("Employee Salary - Sales",   "payroll",    (50_000,  120_000)),
    ("Contractor - Dev",          "contractor", (30_000,  120_000)),
    ("Freelance - Content",       "contractor", (10_000,   40_000)),
    ("Facebook Ads",              "marketing",  (15_000,   80_000)),
    ("Google Ads",                "marketing",  (20_000,  100_000)),
    ("LinkedIn Ads",              "marketing",  (10_000,   50_000)),
    ("Office Rent - Koramangala", "rent",       (45_000,  120_000)),
    ("BESCOM Electricity",        "utilities",   (3_000,   10_000)),
    ("ACT Broadband",             "utilities",   (2_000,    6_000)),
    ("IndiGo Airlines",           "travel",      (4_000,   25_000)),
    ("OYO Hotels",                "travel",      (2_500,   12_000)),
    ("Uber Business",             "travel",      (500,      3_000)),
    ("Client Invoice - Acme",     "revenue",    (80_000,  500_000)),
    ("Client Invoice - TechCo",   "revenue",    (50_000,  300_000)),
    ("SaaS Revenue",              "revenue",    (20_000,  150_000)),
]

# A few anomalous entries to make the dataset interesting
ANOMALIES = [
    {"merchant": "Unknown Vendor XYZ", "amount": -2_500_000, "description": "Suspicious large transfer"},
    {"merchant": "Uber Business",      "amount": -850_000,   "description": "Unusual cab expense"},
    {"merchant": "Petty Cash",         "amount": -999_999,   "description": "Unexplained withdrawal"},
]


async def seed(count: int = 200, base_url: str = BASE_URL):
    print(f"Seeding {count} transactions to {base_url} ...")
    async with httpx.AsyncClient(timeout=30) as client:
        base_date = datetime.now() - timedelta(days=180)
        ok, fail = 0, 0

        for i in range(count):
            merchant, cat, (lo, hi) = random.choice(MERCHANTS)
            amount = round(random.uniform(lo, hi), 2)
            if cat != "revenue":
                amount = -amount

            # Mostly business hours, occasionally odd hours
            hour = random.choices(
                population=list(range(9, 18)) + list(range(0, 9)) + list(range(18, 24)),
                weights=[70]*9 + [2]*9 + [2]*6,
            )[0]
            day_offset = random.randint(0, 180)
            date = base_date + timedelta(days=day_offset, hours=hour,
                                         minutes=random.randint(0, 59))

            payload = {
                "date": date.isoformat(),
                "merchant": merchant,
                "amount": amount,
                "currency": "INR",
                "description": f"Seed #{i+1} — {cat}",
            }
            try:
                r = await client.post(base_url, json=payload)
                if r.status_code == 201:
                    d = r.json()
                    flag = " ⚠ ANOMALY" if d.get("is_anomaly") else ""
                    print(f"  [{i+1:>3}] {merchant:<30} ₹{abs(amount):>10,.0f}  {d.get('category','?'):<12}{flag}")
                    ok += 1
                else:
                    print(f"  [{i+1:>3}] FAILED {r.status_code}: {r.text[:80]}")
                    fail += 1
            except Exception as e:
                print(f"  [{i+1:>3}] ERROR: {e}")
                fail += 1

        # Inject anomalies
        for a in ANOMALIES:
            payload = {
                "date": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                **a,
                "currency": "INR",
            }
            try:
                r = await client.post(base_url, json=payload)
                d = r.json()
                print(f"  [ANO] {a['merchant']:<30} ₹{abs(a['amount']):>10,.0f}  ANOMALY INJECTED")
                ok += 1
            except Exception as e:
                print(f"  [ANO] ERROR: {e}")

        print(f"\nDone. {ok} inserted, {fail} failed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=200)
    parser.add_argument("--url", type=str, default=BASE_URL)
    args = parser.parse_args()
    asyncio.run(seed(args.count, args.url))
