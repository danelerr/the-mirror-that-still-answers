"""Turns raw NASA data into small tables for the web page.

Inputs (folder datos/raw):
  horizons_pioneer10_monthly.txt  -> JPL Horizons API, Pioneer 10 (-23) seen from Earth
  mer_opacity/1tau880_5106_20181207a.tab -> PDS Geosciences, atmospheric opacity measured by
                                            Opportunity's Pancam (880 nm solar filter)
Outputs (folder datos):
  pioneer10_distance_monthly.json
  opportunity_tau880_by_sol.json

Usage: python build_datasets.py <datos folder>

Written with an AI coding assistant, directed and reviewed by team Unsigned Int.
"""
import json
import os
import sys
from datetime import datetime

AU_KM = 149597870.7  # unidad astronómica en km (valor exacto, UAI 2012)

base = sys.argv[1]
raw = os.path.join(base, "raw")

# ---------- Pioneer 10 ----------
rows = []
inside = False
for line in open(os.path.join(raw, "horizons_pioneer10_monthly.txt"), encoding="utf-8"):
    if line.startswith("$$SOE"):
        inside = True
        continue
    if line.startswith("$$EOE"):
        break
    if inside:
        p = [x.strip() for x in line.split(",")]
        date = datetime.strptime(p[0], "%Y-%b-%d %H:%M").strftime("%Y-%m-%d")
        r_au, delta_au, lt_min = float(p[3]), float(p[5]), float(p[7])
        rows.append({
            "date": date,
            "sun_au": round(r_au, 4),
            "earth_au": round(delta_au, 4),
            "earth_km": round(delta_au * AU_KM),
            "light_time_h": round(lt_min / 60.0, 3),
        })
json.dump(rows, open(os.path.join(base, "pioneer10_distance_monthly.json"), "w"), indent=0)
print(f"Pioneer 10: {len(rows)} meses, de {rows[0]['date']} a {rows[-1]['date']}")
for d in ("1973-12-04", "1983-06-04", "2003-01-04", "2026-11-04"):
    r = next((x for x in rows if x["date"] == d), None)
    if r:
        print(f"  {d}: {r['earth_au']} UA de la Tierra = {r['earth_km']:,} km; la luz tarda {r['light_time_h']} h")

# ---------- Opportunity: opacidad del cielo ----------
by_sol = {}
for line in open(os.path.join(raw, "mer_opacity", "1tau880_5106_20181207a.tab"), encoding="ascii", errors="replace"):
    if not line.startswith('"'):
        continue
    p = [x.strip() for x in line.split(",")]
    sol_frac, tau = float(p[3]), float(p[6])
    sol = int(sol_frac)
    by_sol.setdefault(sol, []).append(tau)
out = [{"sol": s, "tau": round(sum(v) / len(v), 3), "n": len(v)} for s, v in sorted(by_sol.items())]
json.dump(out, open(os.path.join(base, "opportunity_tau880_by_sol.json"), "w"), indent=0)
taus = [o["tau"] for o in out]
print(f"Opportunity: {len(out)} soles con medición, del sol {out[0]['sol']} al sol {out[-1]['sol']}")
print(f"  opacidad media por sol: mínimo {min(taus)}, mediana {sorted(taus)[len(taus)//2]}, máximo {max(taus)}")
print("  últimos 8 soles medidos:", [(o["sol"], o["tau"]) for o in out[-8:]])
top = sorted(out, key=lambda o: -o["tau"])[:5]
print("  los 5 soles más oscuros:", [(o["sol"], o["tau"]) for o in top])
