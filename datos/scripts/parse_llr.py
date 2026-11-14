"""Turns the lunar laser ranging CRD files (ILRS / NASA CDDIS) into a table.

Source of the files: NASA CDDIS, International Laser Ranging Service
  ftp://gdc.cddis.eosdis.nasa.gov/pub/slr/data/npt_crd_v2/apollo11/<year>/

Each "11" record is a normal point: a group of photons that left a telescope on
Earth, bounced off the Apollo 11 retroreflector and came back.
  field 1: second of the day (UTC) when the laser fired
  field 2: round-trip time of flight, in seconds
  field 5: length of the measurement window, in seconds
  field 6: number of returned photons used

Usage: python parse_llr.py <folder with .np2 files> <out.json> <out.csv>

Written with an AI coding assistant, directed and reviewed by team Unsigned Int.
"""
import csv
import glob
import json
import os
import sys
from datetime import datetime, timedelta, timezone

C_KM_S = 299792.458  # velocidad de la luz en el vacío, km/s (valor exacto por definición)


def parse_file(path):
    rows = []
    station = code = None
    session_date = None
    for line in open(path, encoding="ascii", errors="replace"):
        p = line.split()
        if not p:
            continue
        tag = p[0].upper()
        if tag == "H2":
            station, code = p[1], p[2]
        elif tag == "H4":
            # H4 tipo año mes día hora min seg (inicio de la sesión)
            session_date = datetime(int(p[2]), int(p[3]), int(p[4]), tzinfo=timezone.utc)
            session_start_s = int(p[5]) * 3600 + int(p[6]) * 60 + int(p[7])
        elif tag == "11" and session_date is not None:
            sod = float(p[1])
            tof = float(p[2])
            # Si el segundo del día es menor que el del inicio, la sesión cruzó la medianoche
            day = session_date + (timedelta(days=1) if sod < session_start_s - 1 else timedelta())
            t = day + timedelta(seconds=sod)
            window = float(p[5]) if p[5] not in ("na", "NA") else None
            photons = int(float(p[6])) if p[6] not in ("na", "NA") else None
            rows.append({
                "utc": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "station": station,
                "station_id": code,
                "round_trip_s": tof,
                "one_way_km": round(tof * C_KM_S / 2.0, 3),
                "photons": photons,
                "window_s": window,
                "file": os.path.basename(path),
            })
    return rows


def main(folder, out_json, out_csv):
    rows = []
    for f in sorted(glob.glob(os.path.join(folder, "*.np2"))):
        rows.extend(parse_file(f))
    # Los archivos diarios y mensuales pueden repetir registros
    seen, unique = set(), []
    for r in sorted(rows, key=lambda r: r["utc"]):
        key = (r["utc"], r["station_id"], r["round_trip_s"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    json.dump(unique, open(out_json, "w", encoding="utf-8"), indent=1)
    with open(out_csv, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(unique[0].keys()))
        w.writeheader()
        w.writerows(unique)
    return unique


if __name__ == "__main__":
    data = main(sys.argv[1], sys.argv[2], sys.argv[3])
    tofs = [r["round_trip_s"] for r in data]
    print(f"registros: {len(data)}  desde {data[0]['utc']} hasta {data[-1]['utc']}")
    print(f"ida y vuelta: mínimo {min(tofs):.6f} s, máximo {max(tofs):.6f} s")
    stations = {}
    for r in data:
        stations[(r['station'], r['station_id'])] = stations.get((r['station'], r['station_id']), 0) + 1
    for (name, code), n in sorted(stations.items(), key=lambda kv: -kv[1]):
        print(f"  estación {name} ({code}): {n} mediciones")
    print("últimas 5:")
    for r in data[-5:]:
        print("  ", r["utc"], r["station"], f"{r['round_trip_s']:.9f} s", f"{r['one_way_km']:.1f} km", r["photons"], "fotones")
