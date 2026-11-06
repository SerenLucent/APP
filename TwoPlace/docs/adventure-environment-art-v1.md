# Adventure environment art v1

Local prototype; not published. Built-in image_gen was used to create five transparent sprites from the approved slim-tree field concept. Originals remain in the Codex generated_images directory.

Outputs:
- public/adventure/environment/tree-v1.png
- public/adventure/environment/rock-v1.png
- public/adventure/environment/house-v1.png

Prompt shared across the three assets: Use the approved field concept only as visual style and elevated camera reference. Create one isolated production game sprite on a genuinely transparent background. Match cute rounded tactile felt/clay miniature style, diffuse upper-left lighting, elevated quarter-view camera looking down roughly 50 degrees, soft ambient occlusion. Entire object visible with transparent padding. No text, labels, borders, horizon, background, ground tile or character; tiny tight contact shadow only.

Tree prompt: Slim small woodland tree with short honey-brown trunk and compact vertical crown of three overlapping pillowy green foliage clumps, a tiny cream flower and little leaves. Crown narrow, height about twice its widest width, no spreading mushroom canopy, no pointed conifer. Small roots and tight moss tuft at its foot; bottom-center ground anchor.

Rock prompt: Chunky rounded gray-beige boulder, broad top plane, restrained moss patch, rounded sculpted facets, two tiny companion pebbles and tightly grouped leaves. Mostly stone, not a plant arrangement. Soft toy rock, no sharp polygon look; bottom-center ground anchor.

House prompt: Compact broad woodland cottage with thick lavender shingles, honey timber trim, cream walls, arched front door, rounded windows, chimney, stone foundation and minimal ivy. Elevated view showing large roof top, front and right wall. Stable squat proportions, no surrounding ground patch or path. Full chimney and all sides inside the frame; bottom-center foundation ground anchor.

Renderer: Sprite alpha bounds are measured once on load. The cached ground canvas is painted once. Original vector renderers remain as asset-load fallbacks. Hitboxes, HP, spawn rules and rewards are unchanged. Objects remain fully opaque even when the player is behind them, as requested.

## Enemy and trap additions (built-in image_gen)

- public/adventure/environment/enemy-v1.png
- public/adventure/environment/trap-v1.png

Enemy prompt: One transparent game sprite, small squat pear-shaped sage-green plush/felt forest spirit, leaf sprout on head, shiny dark-brown eyes, tiny mischievous smile, pink cheeks and very small hand nubs. Elevated 50-degree camera, diffuse upper-left light matching the field reference, no terrain or labels. Readable at 60 pixels.

Trap prompt: One transparent ground-hazard sprite: low circular knot of chunky dusty reddish-brown felt/clay thorn vines with clearly visible short ivory thorn tips and sparse green leaves. Elevated 50-degree orthographic camera, soft miniature-toy shading matching the field reference, no ground tile, no text. Clearly prickly rather than a safe flowerbed. Readable at 120 pixels.
