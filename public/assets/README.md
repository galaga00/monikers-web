# Fish Bowl Assets

Static game assets live here so artwork and sound effects are easy to swap without hunting through components.

## Structure

- `art/home/` - first screen and menu artwork.
- `art/game/` - in-game illustrations, round screens, team/winner art.
- `art/ui/` - buttons, icons, frames, textures, and other interface art.
- `audio/sfx/` - short effects like tap, correct, skip, timer warning, round start.
- `audio/music/` - longer loops or music beds, if used later.
- `docs/specs/` - artist-facing dimensions and safe-area notes.

## App References

Use `lib/assets.ts` as the path manifest. Prefer updating that file instead of hard-coding asset URLs directly in components.

## Naming

Use simple versioned filenames while iterating:

- `home-fish-bowl-v01.png`
- `home-fish-bowl-v02.png`
- `correct-chime-v01.mp3`

When a file becomes the active asset, either update `lib/assets.ts` to point at the chosen version or replace the current placeholder path directly.
