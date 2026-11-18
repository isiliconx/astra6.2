# The Unwritten Symphony

**[Conduct Convergence № 1](https://isiliconx.github.io/astra6.2/orchestra/?seed=1784)**

A **Convergence** is our name for a musical form that discloses its theme by recovering its constraints. A generated three-note call leaps, then recoils by one scale step. At first its pitches and times are scattered. It gains a key, an identifiable rhythm, a harmonic setting, and a voice in the violins. A previously unheard 16-bar movement completes the form. The call opens that movement, then returns in bar 13 over a changed harmony. The arrival draws on Classical-era chamber writing; no Mozart score, MIDI or recording is used.

## Perform the form

| Section | Guided bars | The change you hear |
|---|---:|---|
| Noise | 2 | The call falls apart in chromatic pitches and unmetered attacks. |
| Key | 2 | The same attacks settle into a learned pitch field. |
| Pulse | 2 | The call locks into the exact rhythm of its two-beat signature. |
| Harmony | 4 | A bass and chordal accompaniment give it harmonic direction. |
| Melody | 4 | The violins deliver the exact turn and elaborate it. |
| Return | 16 | A newly decoded chamber movement, with wind–string handoffs and a final cadence. |

The guided run follows this 30-bar score automatically. Scene buttons allow longer rehearsal studies independently of the guided excerpts. Seek on the conductor’s score, set the transport speed or toggle sections in the illustrated seating plan. Export the complete performance as stereo WAV, eight-track Type-1 MIDI (conductor plus seven instrument desks), a single scene’s MIDI, or the full model run in JSON. Full-concert exports use the entire orchestra at the original tempo. New seeds change the teaching examples, musical signature and generated movement.

## What is learned

[model.js](model.js) writes 40 independent eight-bar teaching études and 12 additional evaluation études. Smoothed discrete distributions fit pitch classes, two-beat rhythm cells, harmonic transitions and conditional melodic intervals. Held-out surprise is reported in bits per symbol against a uniform baseline. These are symbolic counts, not a neural model trained on recordings. The harmonic vocabulary, meter, staged form, orchestration, voice-leading constraints and final cadence are designed.

The decoder uses fitted costs, the seed motif and phrase goals to produce the foreground melody. Each of the finale’s contiguous nine-note windows is checked against both étude sets for equal relative scale intervals **and** rhythm; a match triggers resampling. An exact two-beat signature is deliberately shared between this run’s stages. This novelty check applies to those étude sets only, not to all existing music.

[Audio](audio.js) uses independent Web Audio synthesis for violins, violas, cellos, flute, clarinet, horns and timpani, with stereo placement and room reflections. [Score](score.js) engraves actual event times and pitches; unmetered passages are proportionally spaced. [Form and stereo PCM writer](edition.js) · [MIDI writer](midi.js).

## Reproduce

Open this folder's index.html, or serve the repository with a static server. The seed in the URL reproduces an identical model. No account, network service, samples, model download or GPU is required.

Run `node --test orchestra/model.test.cjs` from the repository root. Tests exercise 32 seeds, determinism, musical event bounds, checkpoint structure, exact signature return, corpus non-copying and the tonic ending. For the default seed, the signature is a third up and one scale step back in 3–1–4 sixteenths.
