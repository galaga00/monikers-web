# Fish Bowl Home Artwork Specs

Use this for the first-screen game illustration.

## File To Replace

- Current placeholder: `public/assets/art/home/home-fish-bowl-placeholder.svg`
- The app references this through `lib/assets.ts`.
- Current public path: `/assets/art/home/home-fish-bowl-placeholder.svg`

You can replace that file with final art at the same path, or add a new versioned file and update `ASSETS.art.home.fishBowl` in `lib/assets.ts`.

## Canvas

- Recommended canvas: `1080 x 1920 px`
- Aspect ratio: `9:16`
- Keep important artwork centered so it crops gracefully on slightly different phone screens.

## Safe Areas

- Top title overlay: keep the top `320 px` visually calm enough for the `Fish Bowl` title.
- Bottom button overlay: keep the bottom `440 px` visually calm enough for the `Create Game` and `Join Game` controls.
- Main subject: fish bowl should sit mostly in the middle `900 px` of height.

## Art Direction

- Final art should not include the title text or button text. Those stay as HTML so they remain crisp and easy to edit.
- Transparent, white, or lightly textured areas behind the overlays are helpful.
- PNG, WebP, or SVG will work. Use PNG/WebP for scanned hand-drawn artwork.
