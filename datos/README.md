# Data sources

Every number shown in the story comes from the files in this folder. `raw/` holds the files exactly as NASA serves them. The JSON and CSV files next to this README are the small tables built from them.

Downloaded on November 14, 2026.

## 1. Lunar laser ranging to the Apollo 11 retroreflector

- **What it is.** Each record is a "normal point": a group of photons that left a telescope on Earth, bounced off the Apollo 11 retroreflector and came back. It gives the time, the station, the round-trip time and the number of photons returned.
- **Source.** NASA CDDIS (Crustal Dynamics Data Information System), archive of the International Laser Ranging Service: `ftp://gdc.cddis.eosdis.nasa.gov/pub/slr/data/npt_crd_v2/apollo11/` (anonymous FTP over TLS).
- **Raw files.** `raw/llr_apollo11/`: monthly CRD files for 2025 and 2026.
- **Table.** `llr_apollo11_2025_2026.json` and `.csv`, built by `scripts/parse_llr.py`.

| Fact | Value |
|---|---|
| Measurements between January 3, 2025 and July 7, 2026 | 275 |
| From Grasse, France (station GRSM 7845) | 209 |
| From Apache Point, New Mexico, USA (station APOL 7045) | 66 |
| Shortest round trip | 2.333452 s |
| Longest round trip | 2.671378 s |
| Most recent measurement | July 7, 2026, 07:24:56 UTC, Grasse: 2.505444369 s, 56 photons |

The distance shown is from the telescope to the mirror: round-trip time × speed of light ÷ 2. The small delay added by the atmosphere is not corrected.

About the instrument:

- NSSDCA experiment record 1969-059C-04: https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=1969-059C-04
- ILRS mission page (46 cm × 46 cm, 100 reflectors, deployed July 21, 1969): https://ilrs.gsfc.nasa.gov/missions/satellite_missions/current_missions/ap11_general.html

## 2. The Moon's orbit

- **What it is.** Distance between the centers of the Earth and the Moon every 6 hours, January 1, 2025 to July 15, 2026.
- **Source.** NASA/JPL Horizons API, target 301 (Moon), observer 500@399 (Earth center), quantity 20: https://ssd.jpl.nasa.gov/api/horizons.api
- **Raw file.** `raw/horizons_moon_2025_2026.txt`. Used by the site as `web/data/moon_orbit.js`.

## 3. Opportunity: the sky of Mars, sol by sol

- **What it is.** Atmospheric opacity (tau) measured by the rover's Pancam while looking at the Sun through its 880 nm solar filter. A higher number means more dust and less sunlight on the solar panels.
- **Source.** NASA PDS Geosciences Node, MER Pancam Atmospheric Opacity: https://pds-geosciences.wustl.edu/mer/mer1_mer2-m-pancam-5-atmos-opacity-v1/merao_1xxx/
- **Raw files.** `raw/mer_opacity/`.
- **Table.** `opportunity_tau880_by_sol.json`, the mean per sol, built by `scripts/build_datasets.py`.

| Fact | Value |
|---|---|
| Measurements | 8,639, from January 27, 2004 to June 5, 2018 |
| Sols with a measurement | 4,674, from sol 2 to sol 5105 |
| Typical opacity (median) | 0.69 |
| Darkest storm it survived | sols 1234 to 1249: about 4.5 |
| Its last measurements | sol 5102: 0.758 · sol 5103: 1.713 · sol 5105: 2.259 |

## 4. Pioneer 10: where it is now

- **What it is.** Distance from Earth and from the Sun, and one-way light travel time, once a month from March 1972 to December 2026.
- **Source.** NASA/JPL Horizons API, target -23 (Pioneer 10), observer 500@399.
- **Raw file.** `raw/horizons_pioneer10_monthly.txt`.
- **Table.** `pioneer10_distance_monthly.json`, built by `scripts/build_datasets.py`.

JPL notes that this trajectory "is suitable for general historical purposes, but should be used cautiously for high precision or tracking data applications."

## Scripts

| Script | What it does |
|---|---|
| `scripts/parse_llr.py` | Reads the CRD laser ranging files and writes the measurement table |
| `scripts/build_datasets.py` | Builds the Pioneer 10 and Opportunity tables |

The scripts were written with an AI coding assistant, directed and reviewed by the team.
