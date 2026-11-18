# Sable Relay

**[Enter the vault](https://isiliconx.github.io/astra6.2/sable/)**

A first-person optical puzzle set in three courtyards. Carry a real beam from each emitter to its receiver, rotate the optical cradles in 22.5° increments, and walk through the northern shutter. The last courtyard uses two sources. The survey map is a live navigation instrument: tap a mirror to approach it, then tap it again to turn.

| Play | Controls |
| --- | --- |
| Walk and look | WASD; drag the view or use left/right arrows. Shift moves faster. |
| Turn a nearby mirror | E clockwise, Q counter-clockwise, or the Turn mirror button. |
| Mobile | Touch direction buttons, drag to look, or use the survey map. |
| Pause / restart | P or Escape; use the control deck to reset the current chamber. |

## What runs where

- **Browser game:** [renderer.js](renderer.js) ray-traces the room's signed-distance surfaces, shadows and a mirror reflection. The primary pipeline is WebGPU/WGSL; WebGL2/GLSL is the alternative. If a device cannot present a 3D scene, the game retains its full campaign in 2D tactical view. The game reports the active renderer. WebGPU tests the display path before play: when direct canvas presentation fails, it displays pixels read back from the same WGSL render, rather than replacing 3D with the tactical map. This path was exercised in two Chromium software-adapter configurations. Adaptive resolution trades detail for frame time. No hardware frame-rate target is promised.
- **Puzzle mechanics:** [game.js](game.js) traces rays against oriented finite mirror segments, checks receiver intersections, and drives navigation and gate transitions. Enumerating all 4,168 possible arrangements gives exactly one solution per chamber. The three shortest clockwise-only solutions take 1, 3 and 11 turns. The player can turn either way.
- **Blender:** [build_vault.py](production/build_vault.py) creates the 690-object architectural scene and 88-piece exit seal. The 1,440 × 900 production still and 256 × 256 gate relief were rendered by **Blender 4.5.15 LTS, Cycles OptiX, 96 samples**, on an NVIDIA RTX PRO 6000 Blackwell. The gate texture is sampled by both realtime 3D backends. [Render record and hashes](production/render-record.json) · [editable .blend scene](production/Sable-Relay-Optical-Vault.blend) · [binary glTF gate](assets/seal.glb)
- **Unreal Engine:** the [UE 5.5 source project](unreal/) separately implements the same playable three-chamber game and loads the Blender gate mesh. Its portable C++ puzzle solver compiled and passed all 4,168 cases; 17,439 traced endpoints matched the browser solver to within one micrometre. The Unreal module itself was **not engine-compiled or playtested** here. The web game is native browser code, not an Unreal export or a streamed video. [Download the native source ZIP](unreal/SableRelay-UE5-Source.zip).

## Run

Serve the repository with a static web server (e.g. `python -m http.server`) and open `/sable/`. WebGPU requires a secure context or localhost. All browser assets are local to this repository; there are no hosted compute or asset dependencies. The studio still on the title screen is separate from the live image generated during play.
