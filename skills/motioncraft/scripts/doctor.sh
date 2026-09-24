#!/bin/sh
# motioncraft bootstrap check (Mac/Linux). Works without Node. Detects only - never installs.
say() { printf '%s\n' "$*"; }
ok() { printf '  \342\234\224 %-10s %s\n' "$1" "$2"; }
miss() { printf '  \342\234\226 %-10s missing  ->  %s\n' "$1" "$2"; }
OS=$(uname -s); PM=""
if [ "$OS" = "Darwin" ]; then command -v brew >/dev/null 2>&1 && PM=brew; else
  for p in apt-get dnf pacman; do command -v $p >/dev/null 2>&1 && PM=$p && break; done; fi
inst() { case "$PM:$1" in
  brew:node) echo "brew install node";; brew:ffmpeg) echo "brew install ffmpeg";;
  apt-get:node) echo "see https://nodejs.org (or: sudo apt-get install -y nodejs npm)";; apt-get:ffmpeg) echo "sudo apt-get install -y ffmpeg";;
  dnf:node) echo "sudo dnf install nodejs";; dnf:ffmpeg) echo "sudo dnf install ffmpeg";;
  pacman:node) echo "sudo pacman -S nodejs npm";; pacman:ffmpeg) echo "sudo pacman -S ffmpeg";;
  *) [ "$1" = node ] && echo "https://nodejs.org (LTS)" || echo "https://ffmpeg.org/download.html";; esac; }
say "motioncraft bootstrap ($OS, package manager: ${PM:-none})"
if command -v node >/dev/null 2>&1; then
  V=$(node -v); MAJ=$(echo "$V" | sed 's/v\([0-9]*\).*/\1/')
  if [ "$MAJ" -ge 18 ]; then ok node "$V"; else miss node "$(inst node) (found $V, need 18+)"; fi
else miss node "$(inst node)"; fi
command -v ffmpeg >/dev/null 2>&1 && ok ffmpeg "$(ffmpeg -version | head -1 | cut -c1-40)" || miss ffmpeg "$(inst ffmpeg)  (optional: Remotion ships its own)"
say ""
say "Nothing was installed. Ask the user before running any install command above."
if command -v node >/dev/null 2>&1; then say "Full check: node \"$(dirname "$0")/motioncraft.mjs\" doctor"; fi
