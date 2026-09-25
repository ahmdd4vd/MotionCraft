# Preflight

```bash
node <skill-dir>/scripts/motioncraft.mjs doctor          # full check, prints a table
node <skill-dir>/scripts/motioncraft.mjs doctor --quick  # reuse a check from the last 7 days
```

Doctor never installs anything. It prints a fix command for your OS and a fallback for anything optional.

| Item | Tier | Without it |
|---|---|---|
| Node.js 18+ | required | nothing works |
| npm | required | comes with Node |
| Remotion (in the project) | required | run `npm install` inside the project |
| ffmpeg | recommended | Remotion's bundled ffmpeg is used (`npx remotion ffmpeg`) |
| yt-dlp | recommended | ask the user for the reference file |
| Whisper (faster-whisper, whisper.cpp or openai-whisper) | recommended | phrase-level timing from pauses |
| Python 3 + numpy/scipy/librosa/soundfile/pyloudnorm | optional | pure-Node analysis (slightly less accurate BPM/key) |
| tesseract | optional | no OCR in reference analysis |
| GPU | optional | 3D renders with `--gl=swangle` (software, slower) |
| Free disk > 5 GB | recommended | renders may fail |

Shell wrappers: `scripts/doctor.sh` (macOS/Linux) and `scripts/doctor.ps1` (Windows) just call the same check.

Ask before installing anything on the user's machine. Show them the exact command doctor printed.

GPU device detection is not proof of acceleration. See [GPU/cloud render](gpu-cloud-render.md) before using a paid worker or promising a speedup.
