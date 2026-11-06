# Weapon motion prototype v1

Built-in image_gen generated two transparent 5-column × 2-row sprite sheets. This is a local motion-review prototype, not wired into item drops or combat. No production deployment.

Assets:
- public/adventure/weapons/momo-weapon-motion-v1.png
- public/adventure/weapons/kuki-weapon-motion-v1.png

Source references: existing standing/back Momo and Kuki sprites plus the approved double-sided glass heart wand / double-ended cream-lavender mallet concept. Kuki retains the large star physically attached to the tail tip.

Prompt layout: exactly ten equal cells, five columns and two rows, transparent background. Columns are up (back view), down (front view), left, up-left (rear three-quarter), down-left (front three-quarter). Row one holds weapon in standing idle. Row two shows a forward downward strike, both paws gripping the handle, with the weapon directed ahead of the body. All identity traits, short legs and relative body scale remain consistent. No labels, grids or scenery. Three right-hand directions are runtime horizontal mirrors.

Momo prompt: white cream plush, long pink-tipped ears, brown eyes, cheek blush and heart sprout. Compact pink glass heart wand with identical glossy pink faces, ivory rim, small bow and short cream-pink grip. No hammer.

Kuki prompt: purple plush, cream muzzle and belly, floppy ears, large star attached at tail tip. Compact two-ended lavender mallet with matching cream cushion striking faces and one small golden star on top center of barrel. No star-shaped striking face.

Correction prompt: fix the up-facing strike so it goes away toward the screen top rather than placing the weapon behind the feet, and clean transparent background residue. Other frames retain layout and identity. Up-facing strikes are partly hidden by the body in this rear view; this sheet is an animation draft for review.

Review: weapon-motion-review.html. Controls select character, idle pose, strike pose, repeated two-frame playback or one attack. weapon-motion.js maps sheet cells without altering the source bitmaps.

## Revision 2

Active review assets are momo-weapon-motion-v2.png and kuki-weapon-motion-v2.png; v1 is retained.
Built-in image_gen edit prompts preserve the 5×2 layout and idle frames. Back-facing strikes now lean forward, with hands and weapon naturally hidden on the far side of torso and ears; no weapon is forced between rear feet or above the shoulder. Kuki strikes with one cream end cap facing the ground, the lavender barrel angled upward from contact, and the opposite cream cap above. The small gold star remains an ornament, not the striking surface. Runtime mirroring is unchanged.

## Revision 3 — smooth material and saturated palette
Built-in image_gen editing used; five-by-two poses and weapon geometry preserved.
- Momo: public/adventure/weapons/momo-weapon-motion-v3.png (source exec-34f31255-e952-4109-8a66-699d8dfaf92e.png)
- Kuki: public/adventure/weapons/kuki-weapon-motion-v3.png (source exec-f818a994-c6e9-4c48-a3cb-e0112a4bb334.png)
- References: public/pets/mochi-standing-v2.png and public/pets/kuki-standing-v2.png.
Prompt: Edit material only; preserve exact ten poses, five-column two-row alignment, silhouette, size and rigid T mallet geometry. Match reference smooth dense short silky plush; remove pronounced wavy feather-like engraved marks. Restore rich deep purple and clean ivory/pink; keep golden tail-tip star and glass heart wand. Transparent background; no coarse curls, carved grooves, grain or faded patches.
Kuki was edited a second time with the same material-only constraint to reduce remaining coarse marks. Runtime preview includes a direction-aligned pink/gold downward swing trail. These are preview assets, not yet integrated into combat or published.
Gameplay local change: final destruction gets one second of visible effects before the existing clear-to-roulette sequence; combat and play clock stop at destruction, effects keep updating.

## Weapon pickup prototype
- Damage contacts roll 2% for the attacking character's weapon; ground drops last 45 seconds and only the matching character collects them.
- Equipped attacks and charged damage multiply by 1.5. Successful basic swings / charge hit batches consume one durability, independent of target count; misses consume none. Each character keeps their own 10-charge weapon through swaps. Pickup replaces remaining durability with 10.
- Charged animation stays original; basic idle/strike uses the v3 weapon sheet and a soft pink/gold curved ribbon.
- Trail reference corrected to D:/My/Rune-Midgarts-Village_Demo/assets/images/characters/player_attack_*.png, not effects/slash_hit_*.png. No impact sprite is used by the trail renderer.
- Local-only demo fixture: adventure.html?demo=1&weaponTest=1 puts both weapon pickups near spawn; it does not alter real room data.
