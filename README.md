# The Mirror That Still Answers

An interactive animated story for children aged 8 to 12 about the hardware NASA left on the Moon, on Mars and in deep space. It is told by the mirror that Apollo 11 left on the Moon in 1969, and every interactive moment is driven by real NASA measurements.

**Team Unsigned Int · NASA Space Apps Challenge 2026 · Challenge: Abandoned but not Forgotten**

Live version: https://danelerr.github.io/the-mirror-that-still-answers/

> Work in progress. This repository is being built during the hackathon, November 14–15, 2026.

## The idea

In July 1969, the Apollo 11 astronauts left a laser retroreflector on the Moon: a panel of 100 small reflectors with no battery, no motor and no moving parts. Observatories on Earth still fire lasers at it and time how long the light takes to come back. That is how the distance to the Moon is known.

The story asks one question over and over: **how do we know what we know?** Each machine left out there is evidence that can still be checked.

## How it works

1. Three silent-film title cards introduce the mirror.
2. The viewer presses **Send your light**. A pulse of light travels to the Moon and back. The wait lasts exactly as long as a real measurement did. The first one is the most recent measurement in the archive: July 7, 2026, from Grasse, France, 2.505444 seconds.
3. One small photon appears for every photon that actually returned in that measurement.
4. The Mirror wakes up at Tranquility Base and explains how the travel time gives the distance.
5. A chart shows all 275 measurements from 2025 and 2026 against the Moon's orbit.
6. Each new try replays a different real measurement.

Chapters about the Opportunity rover and the Pioneer 10 probe are in progress.

## Run it

Open `web/index.html` in a browser. There is no build step and there are no dependencies.

## Real NASA data used

| Character | Data | Source |
|---|---|---|
| The Mirror (Apollo 11 retroreflector) | 275 lunar laser ranging normal points, January 2025 to July 2026: time, station, round-trip time, photons returned | NASA CDDIS / International Laser Ranging Service, `npt_crd_v2/apollo11` |
| The Mirror | Distance between the centers of the Earth and the Moon, every 6 hours | NASA/JPL Horizons API, target 301 |
| Opportunity | Atmospheric opacity (tau) measured by the rover's Pancam on 4,674 sols, 2004 to 2018 | NASA PDS Geosciences Node, MER Pancam Atmospheric Opacity |
| Pioneer 10 | Distance from Earth and light travel time, monthly, 1972 to 2026 | NASA/JPL Horizons API, target -23 |

Details, links and the conversion scripts are in [`datos/README.md`](datos/README.md).

## Photos

All backgrounds are real NASA photographs.

| Image | Credit |
|---|---|
| The Earth | NASA, AS17-148-22727, Apollo 17, December 7, 1972 |
| The Moon | NASA, art002e009057, Artemis II, April 4, 2026 |
| Tranquility Base | NASA, AS11-40-5948, Apollo 11, July 20, 1969 |

## How AI tools were used

The challenge rules ask teams to say clearly where AI ("SI") tools were used.

- **Team decisions.** The team chose the challenge, the audience, the angle of the story (how do we know what we know), the visual style and the scope.
- **Story.** An AI assistant suggested using the retroreflector as the narrator and helped shape the chapter structure. It also drafted the on-screen text in English, which the team reviews and edits.
- **Research and data.** An AI assistant located the datasets, downloaded them from the NASA archives and wrote the conversion scripts. Every figure shown comes from the files in `datos/`.
- **Code.** The web page, the animation and the tooling were written with an AI coding assistant, directed and reviewed by the team.
- **Character illustrations.** The cartoon characters were made with an AI image generator from the team's prompts, using NASA photos only as shape references. Code removes the background, colours them and animates them. The originals are in `dibujos/`. A visible notice is shown on screen at all times.
- **Not AI.** The photographs and the data are NASA's.

No AI-generated image uses or modifies NASA logos, flags or mission identifiers.

## Accessibility

- The film grain, flicker and frame shake can be switched off with the **Old film look** button, and are off by default for people who ask their system for reduced motion.
- Every step can be advanced with the mouse, a tap, the space bar or Enter.
- The story is told in text on screen.

## Repository layout

| Folder | Contents |
|---|---|
| `web/` | The site: `index.html`, `style.css`, `main.js`, data files and assets |
| `web/tools/` | Script that cuts, colours and crops the character art |
| `datos/` | Raw NASA data files, the tables built from them and the scripts |
| `dibujos/` | Original character illustrations before processing |

## License

Code and original assets: MIT License, see [`LICENSE`](LICENSE). NASA photographs and data are credited above and remain subject to NASA's media usage guidelines.
