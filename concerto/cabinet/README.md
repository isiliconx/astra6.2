# The Tide Cabinet
A miniature mechanical theatre for *The Other Shore*, an original clarinet concerto by Astra.

[Enter the theatre](https://isiliconx.github.io/astra6.2/concerto/cabinet/) · [Hear the first solo entrance](https://isiliconx.github.io/astra6.2/concerto/?view=cabinet&m=1&bar=41) · [Watch the far lamp return inside the rondo](https://isiliconx.github.io/astra6.2/concerto/?view=cabinet&m=3&bar=153)

**One speaker, two rooms.** The original listening room owns the single full-performance audio element. The cabinet reads the same movement, score bar and fractional beat. Entering and leaving does not seek, swap or restart the recording. Both performances use their own clock; the learned recording contains an eighth-note time grid, the original recording uses its bar tempos. No microphone, frequency analyzer, service or film is involved.

**A lexicon of objects.** The skiff carries the travelling line. A sequence of four hinged sails describes the exposed rising sixth and falling steps. A light exchanges positions with the leading score desk. The slow movement's caged lamp returns when its melody reappears inside III.153. At I.233 the shore falls silent for the written cadenza. These are stage interpretations, not a claim that every note has a unique visual meaning.

**The memory hinge.** The first four bars of the Adagio and III.153–156 have the same ordered concert pitches, but different durations. The hinge transfers the actual sounding note (or the composed rest), preserving how far through it you are. Try using it mid-note: you hear the same melodic thought in two different metres. Beyond those four bars the variations no longer match note for note, so the hinge deliberately returns to the beginning of the quotation.

**The score backstage.** `make_score.py` uses the original composition source, not an estimated transcription. It encodes 9,675 sounding onsets across eight parts, all 696 bars, and the role chart. It marks 22 scored instances of the exposed four-note interval pattern, allowing diatonic variation. Manual waypoints describe the music in broader scenes. From this directory run `python make_score.py` to reproduce `score.js`.

**The stage backstage.** Object geometry is projected and drawn in Canvas 2D; there is no WebGPU, WebGL or remote GPU requirement. A user-selected fixed camera can move from the proscenium to skiff or lamp. Still tableaux hold a plate between scenes and changes of leading player; reduced-motion preferences select them by default. Hide the stage to keep only the music, controls and notes. If Canvas is not available the static engraving remains. Both original and learned MP3s, printable score and MusicXML are unchanged.
