# The Kiln That Sings

A local, dependency-free ceramic instrument. Open **index.html**. Click a pot (or press **1–3**) to select and strike it. Adjust its body radius, height or wall thickness; the drawing and frequencies change together. Choose a chord and **Tune trio** to solve the three wall thicknesses. **Strike chord** sounds all three at one scheduled time. Click one of the five partials to isolate its shape and sound. Browsers require a user gesture for audio.

The three painted stoneware forms, glaze marks, grain and projected surfaces are generated on the device. No recorded samples, downloaded textures, trackers, back end, network calls or GPU API are required. Reduced-motion preferences disable vibration without silencing the instrument.

## What is calculated

- Monotone piecewise cubic interpolation defines three distinct turned profiles, scaled to a physical height and radius. Display units are cm for geometry, mm for the wall.
- Each angular order n = 2, 3, 4, 5, 6 is evaluated with one trial axial shape q(u) = u²(3−u)/2, u being fractional height. The foot is fixed; q and its slope vanish there. Radial displacement is q cos(nθ), and inextensional tangential displacement is −q sin(nθ)/n. Both components displace the actual projected mesh.
- The reduced Rayleigh quotient uses thin-shell bending stiffness D = E h³/[12(1−ν²)], areal mass ρh, and cross-section area weight r ds dθ. Its energy includes circumferential curvature (wθθ + w)/r² and axial curvature wss. Axial arclength includes the profile's slope. The denominator includes radial *and* tangential inertia. Production integration uses 64 meridional intervals and 96 periodic angular samples. Material constants are E = 55 GPa, ν = 0.22 and ρ = 2350 kg/m³.
- A tap projects onto the five radial modes at 94% height and θ = 0.16 rad. The same mode weights, frequencies and decay constants drive Web Audio oscillators and surface displacement. Partial isolation excites just the selected mode. Visual phase runs 1,600 times slower than audio, vibration displacement is magnified, and exponential decay is not slowed. A 3 ms audio attack suppresses clicks.
- Tuning exploits frequency's linear dependence on wall thickness. The slider can display only 0.01 mm increments, but geometry-based auto-tuning retains full precision internally. Targets outside the wall range are explicitly reported, never achieved using an oscillator override.

## Independent numerical checks

Run `node test.js` from this directory. No packages are required. The UI's **Field notes → Check the model against a ring** repeats the first check.

For a **uniform cylinder with constant axial displacement**, the numerical method reduces to a bending ring. The non-discretized angular solution is:

    f_n = h / (2πR²) · sqrt(E/[12ρ(1−ν²)]) · n(n²−1)/sqrt(n²+1).

The solver instead uses a finite-difference second derivative around the circumference. Comparing all five modes against the independent continuous expression gives maximum frequency error of **5.17976%, 1.31505%, 0.33003%, and 0.08259%** at 48, 96, 192 and 384 angular samples respectively. The approximately fourfold reduction per grid doubling is consistent with the second-order stencil.

For a **cylinder with axial bending**, R = 0.10 m, H = 0.12 m, h = 3 mm and n = 2. The polynomial integrals are ∫q² du = 33/140 and ∫(q″)² du = 3. At 384 angular samples and 256 axial intervals the code obtains **237.8545 Hz**, versus the continuous **237.8739 Hz** (0.0082% error). These are checks against analytic references, **not** measurements from real vessels.

Tests also verify inverse-square scaling of all frequencies at constant wall thickness under uniform resizing, linear wall dependence, finite ordered positive frequencies, spatial nodes, and all nine target notes across C major, A minor and D minor. They run the production renderer against real pixel buffers to verify visible silhouettes and mode-dependent deformations on all three vessels. Browser interaction checks are supplied separately as `python test-browser.py` for environments with installed Playwright and Chromium; no installation is needed for the instrument.

## Boundary of the instrument

This is a reduced-order *instrument*, not a full ceramic shell finite-element analysis or a pitch prediction for a pot you plan to fire. It constrains the axial shape, neglects membrane stretching, cross-curvature/Poisson coupling, other axial families, cavity air, glaze layers and foot contact. The wrapped axial beam/ring assumption is an approximation on strong profile slopes. Material constants, radiation weights and damping are illustrative; clear pitch and a playable interface take priority. No physical tap recording or measured ceramic validation is claimed.

## Files

- `model.js`: profiles, eigenfrequency estimates, mode shapes and references.
- `glaze.js`: original ceramic materials and CPU depth-buffered triangle rasterizer.
- `app.js`: tuning, modal audio, surface animation and accessible controls.
- `index.html`, `style.css`: interface and field notebook.
- `test.js`, `test-browser.py`: reproducible numerical/raster and optional browser checks.
