# The Mirror That Still Answers

An animated cartoon for children aged 8 to 12 about the hardware NASA left on the Moon, on Mars and in deep space. It is told by the mirror that Apollo 11 left on the Moon in 1969, in the style of a 1930s cartoon, and every scene is driven by real NASA measurements.

**Team Unsigned Int · NASA Space Apps Challenge 2026 · Challenge: Abandoned but not Forgotten**

Live version: https://danelerr.github.io/the-mirror-that-still-answers/

> Built during the hackathon, November 14–15, 2026.

## The idea

In July 1969, the Apollo 11 astronauts left a laser retroreflector on the Moon: a panel of 100 small reflectors with no battery, no motor and no moving parts. Observatories on Earth still fire lasers at it and time how long the light takes to come back. That is how the distance to the Moon is known.

The story asks one question over and over: **how do we know what we know?** Each machine left out there is evidence that can still be checked.

## How it works

About six and a half minutes, in four parts. The voice tells the story; the pictures show it.

- **Opening.** A storybook opens on a desk; a real 1969 photo of Tranquility Base dissolves into the cartoon Moon, where the Mirror is asleep.
- **Chapter 1, the Mirror.** The viewer presses **Send your light**. A cartoon photon flies to the Moon and back in exactly the time a real measurement took (the most recent one in the archive: July 7, 2026, from Grasse, France, 2.505444 seconds), and one little photon comes home for every photon that really returned. The Mirror wakes up and shows how half of that time gives the distance, how its glass corners send light straight back, and, on a 1930s movie screen, all 275 measurements from 2025 and 2026 against the Moon's orbit.
- **Chapter 2, Opportunity.** Launch, a landing that bounces on airbags, and fourteen years on Mars. The colour of the sky, the Sun and the dust follow the rover's own 4,674 measurements of dust in the sky; the viewer can slide through its days. The 2007 storm and the 2018 storm are played from the real numbers, which climb until they stop.
- **Chapter 3, Pioneer 10.** Through the asteroid belt and past Jupiter. The viewer sends it a greeting, and the film shows how far it is today and how long the greeting would take, from NASA/JPL Horizons. Its whole path since 1972 is drawn from the same data.
- **Ending.** "That is how you know what is true. Not because someone told you. Because you can check."

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

## Real NASA photos

They appear on screen as "proof", next to what the story says.

| Image | Credit |
|---|---|
| Tranquility Base with the mirror | NASA, AS11-40-5948, Apollo 11, July 20, 1969 |
| Opportunity's self-portrait | NASA/JPL-Caltech, PIA17759 |
| Pioneer 10 being prepared | NASA Ames, ARC-1972-AC72-2135 |
| Pioneer 10 at Jupiter (artwork, shown as "NASA ART") | NASA Ames, ARC-1972-AC72-1354 |
| The Earth | NASA, AS17-148-22727, Apollo 17, December 7, 1972 |
| The Moon | NASA, art002e009057, Artemis II, April 4, 2026 |

## How AI tools were used

The challenge rules ask teams to say clearly where AI ("SI") tools were used.

- **Team decisions.** The team chose the challenge, the audience, the angle of the story (how do we know what we know), the visual style and the scope.
- **Story.** An AI assistant suggested using the retroreflector as the narrator and helped shape the chapter structure. It also drafted the on-screen text in English, which the team reviews and edits.
- **Research and data.** An AI assistant located the datasets, downloaded them from the NASA archives and wrote the conversion scripts. Every figure shown comes from the files in `datos/`.
- **Code.** The web page, the animation and the tooling were written with an AI coding assistant, directed and reviewed by the team.
- **Character illustrations.** The cartoon characters were made with an AI image generator from the team's prompts, using NASA photos only as shape references. Code removes the background, colours them and animates them. The originals are in `dibujos/`.
- **Painted scenes.** The painted backgrounds (the Moon, the observatory, Mars, the theater, the launch pad, the radio dish) and three props (rocket, parachute, airbags) were made with an AI image generator (Z-Image-Turbo) run on a team member's computer. Jupiter, the asteroids, the charts and all the signs are drawn by code. A visible notice is shown on screen at all times.
- **Frame-by-frame drawings.** The team generated sprite sheets (eight drawings of one movement each: the Mirror waking up, the photon flying, the airbags bouncing, Opportunity unfolding, sheltering from the storm, shaking off the dust and driving) with an AI image generator (Gemini), from the team's prompts and earlier drawings. `web/tools/cut_sprites.py` cuts them into frames and `web/tools/color_sprites.py` paints them with the film's palette.
- **Opening storybook.** The two paintings of the storybook on the desk were made by a team member with an AI image generator.
- **Animation.** Every movement is animated by code, following Disney's twelve principles of animation (squash and stretch, anticipation, follow-through, arcs, slow in and slow out...). The characters' eyes, brows and white cartoon gloves are drawn by code so they can act on every line.
- **Music.** The two music pieces were made with an AI music generator (ACE-Step 1.5, MIT license) run on a team member's computer. The sound effects are synthesized by code.
- **Narration.** The voice is a team member's own recording, not synthetic. AI speech recognition (NVIDIA Parakeet and OpenAI Whisper, run locally) was used to find the best take of each line, to check that every word is understandable, and to time the animation to each word. Editing, cleaning and loudness matching were done with FFmpeg.
- **Not AI.** The voice, the photographs and the data.

No AI-generated image uses or modifies NASA logos, flags or mission identifiers.

## Accessibility

- The film grain, flicker and frame shake can be switched off with the **Old film look** button, and are off by default for people who ask their system for reduced motion.
- **Captions** for every line can be turned on with the Captions button.
- The interactive moments use real buttons and a real slider, so they work with a keyboard.
- A chapter bar lets anyone jump to any part.

## Repository layout

| Folder | Contents |
|---|---|
| `web/` | The site: `index.html`, `css/`, `js/` (`engine.js` animation engine, `actors.js` characters and props, `story*.js` the shots of each chapter), `data/` and `assets/` |
| `web/tools/` | Scripts that cut and colour the character art and stamp a version on each publish |
| `datos/` | Raw NASA data files, the tables built from them and the scripts |
| `dibujos/` | Original character illustrations before processing |

## License

Code and original assets: MIT License, see [`LICENSE`](LICENSE). NASA photographs and data are credited above and remain subject to NASA's media usage guidelines.
