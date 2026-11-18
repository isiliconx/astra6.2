# The City That Fits in a Book
A standalone paper-mechanics exhibit. Open `index.html` directly in a modern browser; no build, fonts, network, package manager or permissions are required. Open `pattern.html` to print the three A4 sheets at actual size, or use the prebuilt `field-pattern.pdf`. Verify the 50 mm scale bar before cutting. The 572 × 330 `thumb.webp` is rendered from the actual default scene.

## Explore
Use the book-angle slider (arrow keys, Home, End), replay/pause the opening, alternate between opposed oblique views, and send the tram across the spine at 180°. With reduced motion enabled, playback and tram trips use discrete poses. The live status describes controls without continuously announcing animation frames. Each facade has its own shop sign, lighted windows, canopy and printed ornament; the closed book has an outer cover.

## Physical model
The base is 188 × 146 mm, folding into a 94 × 146 mm cover. Four independently hinged facade pairs lie in disjoint intervals along the spine. For one stall, the two base feet lie distances a and b from the spine. In the closed stack its crest lies distance p from the spine, so its unchanging panel lengths are L=p−a and R=p−b. Opening the leaves moves the feet onto the positive and negative half-angle rays. The crest stays at the outward intersection of circles of radii L and R around the feet. All positions are in millimetres. The mathematical degeneracy at zero is handled by the known closed position. The same dimensions generate the print pieces, folds, and glue pads.

Open `pattern.html` for the dimensioned base, house strips, awnings, token, key and assembly. Main strips open automatically after assembly. The 6.8 mm awnings are manual; animated canopy angles are illustrative. The printed tram is a hand-slid tent token, not a powered carriage. The base artwork, fascia details and tram finishes are simplified for printing.

## Tests and limits
Run `node verify.cjs` from any directory. The script checks all four mechanisms at 1,801 positions each (0 through 180 degrees at 0.1-degree intervals): invariance of panel lengths, interior page half-spaces, closed alignment/containment, sampled continuity, disjoint building intervals and the tram's corridor. It exercises both orientations, slider states, replay and the tram using the actual application handlers; it counts print sheets and checks scale-bar geometry. `node verify.cjs --svg` additionally writes standalone SVGs for reproducing the three print plates and current scene with a local SVG/PDF renderer.

This is an ideal zero-thickness construction, not a physical build test. No paper thickness, friction, glue-flex, sweep of moving tram while folding, full mesh collision proof or manufacturing tolerances were measured. Stow awnings and remove the tram before closing.
