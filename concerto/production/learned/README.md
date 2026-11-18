# The reed and the room
## Two performances of *The Other Shore*

[Play the learned take](https://isiliconx.github.io/astra6.2/concerto/?take=learned) · [Play the original](https://isiliconx.github.io/astra6.2/concerto/?take=original) · [Compare the same passages](https://isiliconx.github.io/astra6.2/concerto/#comparison)

Both performances follow the same manuscript. In the first forty bars, violins and bassoon still tell the story without the soloist. At bar 41, the clarinet now comes forward without pulling the whole ensemble down. In the Adagio, the ends of lines yield space to the bassoon; the quicker, tongued rondo stays closer to the orchestra. Listen for the deliberately different space around the reed in those three passages.

### What is actually learned?

**Reed** is a small supervised kernel-ridge model, not a neural network. It was fitted to 97 individual CC0 clarinet recordings: 33 sustained and 64 short, over 11 sounding sample roots and three recorded dynamic layers. Given sounding pitch, requested intensity and articulation, it predicts onset and body harmonics, body level and bounded envelope landmarks. Filters apply those learned changes to real medium-layer recordings. This is a sampled clarinet timbre realizing the concert pitches of the A-clarinet part, not a measured reconstruction of a particular A clarinet.

For a blind check, we withheld every take of B♭3 and F5 (18 recordings), then synthesized the soft and loud versions from their **medium** recorded carriers. On the 12 soft/loud targets, average error in the change of eight body harmonics was **3.67 dB with the model vs. 5.90 dB with the same carrier and gain alone**. Across all eleven held-out-root folds, predicted body-level change error was 2.15 vs. 4.82 dB. That supports one specific use of learning: changing timbre and strength with intensity. It does **not** establish listener preference. A nearest same-layer sample was a stronger benchmark on some absolute spectra, and the duration of a note attack was not consistently better predicted.

[Download the runnable model, acoustic carriers, training code, source manifest, license, tests and isolated A/B WAVs (3.9 MiB)](Reed-Learned-Clarinet-Source.zip) · [held-out waveform test](inference-verification.json) · [full validation](validation.json)

### What was interpreted by hand?

The 2,190 solo note onsets are driven by the unchanged score. Breath marks, passing notes, repeated-note articulation, small ensemble onset offsets, rubato, slur overlap and phrase direction are performance rules. Long notes lean differently according to the following interval. The same conductor clock drives all desks, with additional flexibility in the written-out cadenza. The orchestral desks can use 65 extra soft or alternate bow/tongue carriers. Their seating is stable, but leading and answering a phrase are different jobs. There is no automatic broadband orchestra duck when the solo plays.

The mix is intentionally less aggressive in the exposed Adagio and more direct in the skipping rondo. We calibrated it against the two separated sources, then mastered each movement to the prior recording's integrated loudness. The original MP3s, composition, PDFs, MIDI and MusicXML remain unmodified. Neither rendition is a live ensemble, and the model did not learn a human player's rubato, compose the piece, or listen to recordings of Mozart.

### What changed in the recordings?

| Passage | Original solo : orchestra | New solo : orchestra |
|---|---:|---:|
| I. First solo entrance, mm. 41–48 | −2.11 dB | +2.38 dB |
| II. Opening song, mm. 1–4 | +1.87 dB | +4.47 dB |
| II. Return of the song, mm. 105–112 | −4.34 dB | +4.08 dB |
| III. First refrain, mm. 1–8 | −5.09 dB | +2.66 dB |

Those figures compare separately rendered stereo solo and ensemble energy within 550–3,000 Hz, in 120 ms windows containing sounding solo. They are **not** a track-volume knob or a guarantee about every playback device. Solo rests do not count. Broader-band figures and other test passages are included in the [recording checks](recording-checks.json).

| Movement | Original / new integrated loudness | New true peak | New score time |
|---|---:|---:|---:|
| I | −20.8 / −20.9 LUFS | −2.9 dBTP | 11:17 |
| II | −22.7 / −22.8 LUFS | −4.2 dBTP | 8:31 |
| III | −21.5 / −21.6 LUFS | −4.3 dBTP | 6:15 |

The **six listening-room excerpts all measure −21.6 LUFS** as decoded MP3. Switch takes within a passage to hear the smaller differences without a loudness advantage. The room tracks all 696 score bars on each performance's own eighth-note clock. Offline verification decoded all three complete new recordings; a blind periodicity detector matched all 131 tested cadenza notes to the manuscript (median absolute error 2 cents). The older masters and comparisons have not been substituted for the new files. No professional listening panel is claimed.

### Reproduce

Use Python 3 with NumPy and SciPy, plus FFmpeg compiled with libmp3lame. The 97 clarinet takes and the additional orchestra recordings come from [Versilian Studios Chamber Orchestra 2 Community Edition](https://github.com/sgossner/VSCO-2-CE/tree/440300901dfe9275fd84e0b7763af1f8443ae62e), released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). The source manifests pin and verify individual Git blob hashes. The original three released MP3s must be in the listening room's audio directory for loudness matching and excerpt creation.

From the parent production directory, run `python compose.py` and `python samples.py` to produce the manuscript and fetch the original sample set. From this directory:

```sh
unzip Reed-Learned-Clarinet-Source.zip
mv Reed model
python ensemble_palette.py
OPENBLAS_NUM_THREADS=1 python performance.py both
OPENBLAS_NUM_THREADS=1 python master.py
```

The first model call performs **inference using fitted weights**, entirely on CPU. To refit it, follow the instructions inside the model archive. The last two commands regenerate the timing map, stereo stems, three learned masters and six comparison clips. Room decay extends each complete recording by 1.38 seconds beyond the score.
