# Sable Relay · Unreal source edition

You stand in an open-roof signal gallery. Walk up to an optic, rotate its mirror, and follow the carrier to the north arch. The third room requires two beams to stay aligned at once.

**Delivery status:** This is a native, single-player **Unreal Engine 5.5 C++ source project**, not a packaged executable. The web edition runs its own browser renderer; its screenshots are not Unreal screenshots. The native optical kernel was compiled and exhaustively tested; UnrealBuildTool, the editor, Play-in-Editor (PIE), and platform packaging were not available for this release. Materials, lighting, input feel, collision and stage transit still need a native playtest.

## Open the project

1. Use an existing Unreal Engine **5.5** installation with the [C++ toolchain for your platform](https://dev.epicgames.com/documentation/en-us/unreal-engine/setting-up-your-development-environment-for-cplusplus-in-unreal-engine). Enable the **Procedural Mesh Component** plugin bundled with the engine; the project descriptor already requests it. No Marketplace or Starter Content dependencies.
2. Extract the source ZIP to a writable location. Open `SableRelay.uproject` and build its module. On Windows, you can also right-click the project file, generate project files, and build **SableRelayEditor / Development Editor / Win64**. [Epic: managing game code](https://dev.epicgames.com/documentation/unreal-engine/managing-game-code-in-unreal-engine).
3. Press **Play** in the configured Entry map, not Simulate. An empty viewport before play is normal: the GameMode constructs the gallery on start. If testing in another map, clear its GameMode override or set it to **RelayGameMode**.
4. To validate on your own engine build, open **Tools → Test Automation**, find `SableRelay.Optics.Campaign`, and run it. Then physically complete the three chambers. Automated math tests are not a substitute for PIE and a cooked build.

Example CLI on Linux, from this project directory, with `UE_ROOT` pointing at the installed engine root:

```sh
"$UE_ROOT/Engine/Build/BatchFiles/Linux/Build.sh" SableRelayEditor Linux Development -Project="$PWD/SableRelay.uproject"
"$UE_ROOT/Engine/Binaries/Linux/UnrealEditor" "$PWD/SableRelay.uproject" '/Engine/Maps/Entry?game=/Script/SableRelay.RelayGameMode' -game
```

The [Unreal packaging workflow](https://dev.epicgames.com/documentation/unreal-engine/build-operations-cooking-packaging-deploying-and-running-projects-in-unreal-engine) is a separate step. The configuration includes the Entry map and stages the packed Blender geometry through Unreal's virtual file system.

## Controls

| Input | Operation |
| --- | --- |
| WASD / mouse | Walk / look |
| E or left click | Turn the nearest mirror within 2.05 m forward by 22.5° |
| Q | Turn it back one notch |
| Tab | Toggle live overhead optics plan |
| R | Reset the current chamber; restart after the final transmission |

The mirror's **long edge**, not its normal, determines its angle. The arch lifts while every receiver is illuminated. Walk through before changing the mirrors again.

## Anatomy

- **RelayOptics.h:** engine-independent, two-sided ray/finite-segment reflection, circle absorbers, nearest-hit ordering, returning-source absorption and loop termination. All distance calculations run in metres; UE rendering converts to centimetres (+X north, +Y east).
- **RelayRoom / RelaySeal:** batched meshes for the basalt colonnade and orbital skyline, point and directional lighting, indexed mirror apparatus, visible beam segments, non-latching sliding exit and an actual Blender rosette on its shutter.
- **RelayPilot / RelayHUD / RelayGameMode:** capsule locomotion, eye camera, reversible controls, live plan, objective and receiver state, campaign progression and replay.
- **Seal data:** 88 authored Blender objects; 7,472 triangles joined into five material sections. `Tools/SourceArt/seal.glb` is the editable interchange mesh. `Tools/bake_seal.py` converts that local glTF export to the compact file loaded by Unreal. The material finishes are reinterpreted by the runtime; Cycles node graphs are not shipped as Unreal materials.

To rebuild the seal payload (Python 3, standard library only):

```sh
python3 Tools/bake_seal.py Tools/SourceArt/seal.glb Content/Relay/seal.srm
```

## Verification without Unreal

From the source project's root, with a C++17 compiler and, for comparison, Node.js:

```sh
c++ -std=c++17 -O2 -Wall -Wextra -pedantic Tests/optics_test.cpp -o /tmp/sable-optics
/tmp/sable-optics
node Tests/parity.cjs /tmp/sable-optics
```

The release passed all **4,168 mirror configurations** (8 + 64 + 4,096). Each chamber has one winning state. The C++ and independent JS solvers agreed on every receiver and **17,439 ray endpoints** to within one micrometre. The stand-alone test also exercises reverse-turn wrapping and re-locking after a solution changes. See `VALIDATION.md` for the QA boundary and a native playtest card.
