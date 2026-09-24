# Notes for AI agents working on this repo

- The skill lives in `skills/motioncraft/`. `SKILL.md` must keep `name: motioncraft` (same as the folder) and stay under 500 lines. Put detail in `references/`.
- The CLI is `skills/motioncraft/scripts/motioncraft.mjs`, plain Node ESM with no npm dependencies. Keep it that way so it runs right after install.
- Every visual value lives in `styles/<id>/tokens.json`. Components read tokens; never hard-code colors or sizes in components.
- Wrap any new text/card component in `McBox` so `qa overlap` can check it.
- After changing the template, run in a test project: `motioncraft new /tmp/t && cd /tmp/t && npm install && node <skill>/scripts/motioncraft.mjs qa overlap --comp Main`.
- After changing a style: `motioncraft style check styles/<id>/tokens.json`.
- No third-party audio, fonts without an open license, or unverified claims in docs.
