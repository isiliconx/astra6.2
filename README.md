# Astra Observatory

**[Open the interactive exhibition](https://isiliconx.github.io/astra6.2/)**

A browser cabinet of original instruments, simulations, sculptures and games built with Astra 6.2. Search the collection, filter by discipline, or open any exhibit by its `#lab/id` link. Most canvas instruments offer pause, restart and PNG export. The two standalone exhibits have their own controls and output formats.

## New musical form: [The Unwritten Symphony](https://isiliconx.github.io/astra6.2/orchestra/)

A **Convergence** develops one seed gesture from unmetered sound through key, pulse, harmony and melody. In the final movement, a fitted symbolic model generates an original 16-bar chamber score. Conduct the run, switch scenes, mute sections on the seating plan, read the moving score, or download a multitrack MIDI and its reproducible run data.

[Music, model and verification](orchestra/) · [Play the default seed](https://isiliconx.github.io/astra6.2/orchestra/?seed=1784)

## Featured game: [Sable Relay](https://isiliconx.github.io/astra6.2/sable/)

A first-person optical vault with three hand-authored puzzles. Walk the chambers, rotate the optical mirrors, and use reflected light to unlock each northern gate. A WebGPU ray tracer draws the world and its specular reflections; WebGL2 is the alternate 3D renderer. Tactical mode preserves the whole campaign without a 3D API.

[Game source and production details](sable/) · [Native Unreal Engine 5 C++ source](sable/unreal/) · [Blender production script](sable/production/build_vault.py)

## Start here

- **[Flip Atlas](https://isiliconx.github.io/astra6.2/#lab/flip-atlas)** — launch a double pendulum from a point on a GPU-computed first-inversion map.
- **[Mare Approach](https://isiliconx.github.io/astra6.2/#lab/mare-approach)** — bring a fuel-limited lander down on pad H-04.
- **[Jacquard Moon](https://isiliconx.github.io/astra6.2/#lab/jacquard-moon)** — reveal the warp and weft of a programmed textile.
- **[Copper Selvedge](https://isiliconx.github.io/astra6.2/#lab/copper-selvedge)** — turn a woven knot in three dimensions.
- **[The Last Connection](https://isiliconx.github.io/astra6.2/#lab/last-train)** — explore what a transfer delay does to your last reachable train.
- **[Corona Loom](https://isiliconx.github.io/astra6.2/#lab/corona-loom)** — turn the toroidal filament sculpture behind the cover.

## What actually ran on the GPU

Both published assets were computed on an **NVIDIA RTX PRO 6000 Blackwell Server Edition**. The displayed data and GPU record travel with the site; visitors do not need the notebook, credentials, or CUDA.

| Exhibit | GPU calculation | Reproducible source | Run record |
| --- | --- | --- | --- |
| Corona Loom | 2,304 filaments × 4,096 samples, projected into a 1,152 × 728 plate | [render_corona.py](studio/render_corona.py) | [render.json](studio/render.json) |
| Flip Atlas | 504 × 336 initial conditions, 780 RK4 steps each; 12.48 s per trajectory | [render_flip.py](studio/render_flip.py) | [flip-render.json](studio/flip-render.json) |

Flip Atlas is a finite-time map of **first inversions**, not a formal chaos diagnostic. Orange marks the lower link flipping first; teal the upper link; slate neither within the sampled interval. More positive starting angles point to the right/up. Mobile and desktop visitors can select a point on the map to integrate that trajectory locally. At basin boundaries, the exact pointer and nearest precomputed pixel may differ.

## Run or archive it

No build tools, accounts, tracking, hosted APIs or third-party scripts are required. Open `index.html` after unzipping the project, or serve the folder with `python -m http.server`. Source and evidence links are optional and require internet.

To create a single HTML file with embedded visuals and scripts:

```sh
python studio/bundle.py astra-observatory.html
```

Each classic script in `labs/` registers an experiment with its controls, canvas renderer and explanatory copy. Previews are renders of the instruments or game artwork. The instruments use Canvas 2D and native input. The Sable Relay game uses its own hardware-accelerated renderer. Its purpose is exploration, not engineering, medical or navigation use.
