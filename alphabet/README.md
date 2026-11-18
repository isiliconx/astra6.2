# The Impossible Alphabet

A virtual foundry for one stepped bronze anamorph: a **B** from the front, an **E** overhead, and a **swift in flight** from the right. Open `index.html` directly. The four runtime files are local; no build step, network, WebGL, accounts, remote computation, three-camera model swapping, or external font.

**Controls:** drag or use the arrow keys on the canvas; 1/2/3 align the three axes, Home restores the sculpture view. The inspection sheet selects axes, switches bronze/silhouette, and overlays the target with missing pixels. Turntable is opt-in. A separate randomized, unlabelled free-response exercise collects only the current participant’s three answers in memory, then reveals the key. There is no reported human recognition rate.

## Geometry and audit

The 34 × 48 × 44 construction grid uses 1.4 mm voxels. The B’s two counters and curved bowls and the swift’s swept wings are independently specified polygons. The E consists of a spine and three rectangular arms. A voxel survives exactly when its front, top, and side cell centers pass all three respective stencils. Only externally exposed cube faces are triangulated. The CPU renderer shades these same faces using an orthographic z-buffer and vertex-level lighting. The turntable rings and floor shadow are presentation elements, not STL geometry.

| Orthographic projection | Target cells | Cast cells | IoU at −5° | Aligned IoU | IoU at +5° |
|---|---:|---:|---:|---:|---:|
| B / front | 975 | 975 | 92.36% | 100.0% | 92.55% |
| E / overhead | 1,000 | 992 | 95.11% | 99.2% | 94.81% |
| Swift / side | 576 | 576 | 83.19% | 100.0% | 82.01% |

IoU is the area of overlap divided by the area of union of the projected sculpture and the original stencil. The E loses eight cells at the edge of its central arm. The stencils are authored, not created from the resulting mesh. For off-axis tests the camera rotates about the aligned image's vertical axis, preserving center, scale and a fixed orthographic plane. Binary mask samples are at 3× per axis; no realignment or rescaling. These numbers **are not recognition rates**.

**Serialized mesh:** 10,413 occupied cells, one face-connected component, 7,186 unique geometric vertices, 14,376 triangles. All triangle edges have exactly two oppositely directed incident faces; every vertex has a single closed link. Signed volume ≈ 28,573.273 mm³, consistent with 10,413 × 1.4³. The independently parsed STL projects back to all three modeled masks. SHA-256 of the 718,884-byte binary STL: `768e48253b8db56c49f40d0d14e16840b4fb2dc117728485736de47151cc1c8b`.

## Fabrication

The checked-in [binary STL](impossible-alphabet.stl) is identical to the browser download. Use millimeters. The exporter applies an orientation-preserving permutation (y,z,x) so the flat swift silhouette is already on the bed: **67.2 × 61.6 × 47.6 mm**, about 1,129 mm² of bed contact. An occupancy audit finds 212 cells lacking direct previous-layer support in x-slices 19–25 (26.6–35.0 mm above the bed). Inspect those horizontal overhangs in your slicer and choose material, support and removal settings accordingly. Small features can be one voxel (1.4 mm) across. Model topology is verified, not mechanical strength, support-free printability, or a physical test print.

## Reproduce

From this folder:

```sh
node model.test.cjs             # dependency-free geometry, STL topology, STL projection and support audit
node model.test.cjs --write     # regenerate the same STL and verify
node render.test.cjs            # optional: installed @napi-rs/canvas, 6,296 pixel-center ray checks
node plate.cjs                  # optional: same local canvas implementation, regenerates cover.jpg
node browser.test.cjs           # optional: installed Playwright + Chromium (CHROMIUM_PATH override)
```

The browser integration script is supplied for interactive controls and mobile-width checks. It makes no network requests; optional CAST_SHOTS is an existing directory for its screenshots. Geometry and real canvas renderer tests passed in the build environment. Headless Chromium there was prevented from opening its local socket, so the optional browser smoke was not counted as a pass.
