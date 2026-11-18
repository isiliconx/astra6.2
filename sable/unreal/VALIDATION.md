# Validation card

| Check | Release evidence |
| --- | --- |
| C++17 compile of exact native optical kernel | PASS · GCC 14.2.0, `-pedantic -Wall -Wextra -Werror` |
| Independent exhaustive ray comparison | PASS · Node 24.22.1 compared all 4,168 states, 17,439 endpoints and all receiver masks |
| Undefined-behavior sanitizer, same states | PASS · GCC UBSan with recovery disabled |
| Blender model conversion | PASS · Blender 4.3.2 GLB export; 88 nodes, 7,472 triangles, 5 materials; reproducible packed mesh. Hashes in `Content/Relay-seal-receipt.json`. |
| UnrealHeaderTool / UnrealBuildTool / PIE | NOT RUN · no engine installation in authoring environment |
| Native light, materials, geometry, framerate, collision | NOT MEASURED · needs Unreal and a supported GPU |
| Packaging, standalone binary, platform support | NOT TESTED · no native binaries included |

## Native commissioning checklist

1. Compile the editor target, making sure the bundled Procedural Mesh Component module is enabled. Run the automation test. Verify there are no load failures for the basic shape meshes/material.
2. Start PIE and walk, strafe and look around. The slate floor must support the player; the shutter must block the threshold. Confirm the calibration rosette on the shutter is a raised mesh, not a flat card.
3. Approach mirror A. Rotate one notch, then one backwards: the north arch should open, then close. Turn forwards again and walk through the arch.
4. Confirm the second room spawns afresh; turn A once and B twice, then cross. In the third room, open one receiver, move its mirror to extinguish it and check the arch remains locked. Both receivers must stay on simultaneously.
5. Bring both circuits into alignment, cross the final arch, verify time and rotation totals. Press R to restart. Repeat in a cooked Development build and log the engine minor version, GPU, native resolution and observed errors.

Solution witness for native QA (mirror order A/B/C/D; steps are forward clicks from reset): First Light **1**; Switchback **1, 2**; Parallax **2, 3, 2, 4**. These are test witnesses, not script-controlled wins: the arch reads the geometric solver.
