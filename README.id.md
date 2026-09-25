<div align="center">

<img src="media/motioncraft-logo.png" alt="MotionCraft logo" width="640">

**Bikin video motion graphics yang rapi dan berkelas, dikerjain AI agent kamu pakai Remotion.**

Kasih agent kamu satu topik (atau video yang kamu suka). Dia riset, nulis naskah, nyamain tiap kata sama suara, bikin musik dan sound effect sendiri, nyusun videonya, ngecek pixel video akhir dan audionya, terus render.

```bash
npx skills add ahmdd4vd/motioncraft
```

[English](README.md) · Bahasa Indonesia

</div>

## Contoh hasil motioncraft

Klik preview-nya buat nonton video lengkap pakai suara.

<table>
<tr>
<td width="50%"><a href="https://github.com/ahmdd4vd/motioncraft/releases/download/v0.1.0/pi-v2.mp4"><img src="media/pi-v2-loop.gif" alt="Explainer agent harness, gaya pi-v2"></a><br><b>Explainer agent harness</b> · 61 detik · Inggris · pi-v2</td>
<td width="50%"><a href="https://github.com/ahmdd4vd/motioncraft/releases/download/v0.1.0/hindsight.mp4"><img src="media/hindsight-loop.gif" alt="Explainer Hindsight"></a><br><b>Hindsight: memori buat agent</b> · 66 detik · Indonesia</td>
</tr>
<tr>
<td width="50%"><a href="https://github.com/ahmdd4vd/motioncraft/releases/download/v0.1.0/impeccable.mp4"><img src="media/impeccable-loop.gif" alt="Explainer Impeccable"></a><br><b>Impeccable: website buatan AI jadi lebih bagus</b> · 83 detik · Indonesia</td>
<td width="50%"><a href="https://github.com/ahmdd4vd/motioncraft/releases/download/v0.1.0/tutorial.mp4"><img src="media/tutorial-loop.gif" alt="Tutorial bikin video pakai AI agent"></a><br><b>Tutorial: bikin video pakai AI agent</b> · 53 detik · Indonesia</td>
</tr>
</table>

## Bisa apa aja

| | |
|---|---|
| **Gaya siap pakai** | 5 gaya (`pi-v2`, `pi-v2-dark`, `warm-paper`, `mono-editorial`, `tech-neon-soft`), semua diatur dari satu file token. Atau kasih video yang kamu suka, nanti dia tiru *feel*-nya. |
| **Teks pas sama suara** | Kata muncul pas diucapin (timing per kata dari Whisper, atau dari jeda kalau Whisper gak ada). |
| **Musik original** | 7 preset musik instrumental yang dibikin langsung di laptop kamu, gak ada urusan lisensi. Ada pengaman biar tiap video gak kedengeran sama. |
| **Sound design** | 16 sound effect dalam 5 pack, nempel ke beat, di-mix ke -14 LUFS. |
| **Template Remotion** | Headline, kartu UI, checklist, counter, step card, bentuk 3D beneran, maskot, end card. |
| **QA jujur** | Cek overlap kotak debug dan sampel frame dari video akhir: contact sheet, tanda teks kecil di HP, area UI 9:16, area headline, dan font. Sampelnya petunjuk review, bukan bukti semua frame bebas tabrakan. |
| **Siap dibagiin** | Preset render buat WhatsApp (di bawah 16 MB), Instagram, YouTube, dan file master. |

## Baru di v0.4

- **Storyboard dan preview cepat.** `storyboard` mengubah brief jadi rentang frame per scene dan kerangka naskah buat direview. Setelah scene dibangun, `preview` bikin still asli dan contact sheet. `cache3d` menyimpan frame 3D yang berat, jadi revisi teks/audio tidak perlu render WebGL ulang. Naskah tetap harus ditulis dan di-approve. [Panduan perencanaan](skills/motioncraft/references/phase1-planning-and-preview.md).
- **Audio dari timeline.** Tandai event scene seperti ketikan, klik, transisi, logo dan CTA, lalu `sfx auto` memasang cue yang hemat dan tepat waktu. `music moods` membantu pilih preset instrumental per video; `mix --duration` memotong musik sesuai panjang video dengan fade. Dengarkan mix dan jalankan `mix review --approve` sebelum render dengan audio. Event berasal dari anotasi brief, bukan deteksi visual otomatis. [Panduan audio](skills/motioncraft/references/phase2-timeline-audio.md).
- **QA pixel akhir.** `qa pixels` mengambil sampel dari video yang sudah diekspor: frame ukuran asli, contact sheet dan tanda teks terlalu kecil di HP, zona UI aplikasi 9:16, area headline yang ramai, serta impor font. Buka frame aslinya, tonton video penuh dan dengarkan audio: sampel ini maupun `qa overlap` tidak menjamin nol tabrakan. [Panduan QA pixel](skills/motioncraft/references/phase3-pixel-review.md).
- **Dua template pi-v2.** `ProductLaunch` (30-60 detik) menyusun masalah → demo asli → fitur terverifikasi → CTA. `ScreenTutorial` (30-90 detik vertikal) punya focus zoom, pointer highlight dan caption di bawah panel rekaman. Keduanya menampilkan placeholder DO NOT PUBLISH sampai rekaman asli dan kredit sumber dimasukkan; `template launch|tutorial` memvalidasi props dan file frame, bukan keaslian atau lisensi. [Panduan template](skills/motioncraft/references/phase4-templates.md).

## Install

```bash
npx skills add ahmdd4vd/motioncraft
```

Jalan di AI agent apa aja yang dukung [Agent Skills](https://agentskills.io) - Claude Code, Codex, Cursor, Gemini CLI, Pi, Hermes Agent, dan banyak lagi (di-install pakai [skills CLI](https://github.com/vercel-labs/skills), ada juga di [skills.sh](https://skills.sh)).

Butuh **Node.js 18+**. Remotion dan lainnya di-install per project video. Opsional: Python + faster-whisper (timing per kata), yt-dlp (download video referensi).

## Cara pakai

Tinggal minta ke agent kamu:

> Bikinin video explainer 60 detik tentang \<topik\> pakai gaya motioncraft pi-v2, 16:9, voiceover bahasa Indonesia.

> Ini video yang gue suka: \<link\>. Bikinin yang kayak gini tentang \<topik\>.

Agent-nya ngikutin alur: **brief → riset → naskah → suara → musik & SFX → build → QA → render → feedback kamu**. Kamu approve naskah dulu sebelum ada suara atau render, dan kamu dapet screenshot dulu sebelum video full.

## CLI

Semua yang dikerjain skill ini juga bisa dijalanin manual:

```bash
node skills/motioncraft/scripts/motioncraft.mjs doctor               # cek laptop kamu
node skills/motioncraft/scripts/motioncraft.mjs new my-video --style pi-v2
node skills/motioncraft/scripts/motioncraft.mjs storyboard --brief brief.json --out storyboard.json
node skills/motioncraft/scripts/motioncraft.mjs preview --dir my-video --board storyboard.json --comp Main
node skills/motioncraft/scripts/motioncraft.mjs sfx auto --board storyboard.json --out audio/auto-cues.json
node skills/motioncraft/scripts/motioncraft.mjs music moods --mood premium
node skills/motioncraft/scripts/motioncraft.mjs mix --music audio/music.wav --sfx audio/sfx.wav --duration 52 --out audio/final.wav
node skills/motioncraft/scripts/motioncraft.mjs mix review --file audio/final.wav --approve  # setelah didengarkan
node skills/motioncraft/scripts/motioncraft.mjs render --preset wa --audio audio/final.wav
node skills/motioncraft/scripts/motioncraft.mjs qa pixels out/final.mp4 --board storyboard.json --dir .
```

Jalanin `... help` buat liat semua command.

## Isinya

```
skills/motioncraft/
  SKILL.md          alur kerja yang diikutin agent
  references/       15 panduan singkat (naskah, suara, musik, tipografi, QA, taste...)
  scripts/          CLI motioncraft (engine audio pure Node, analisis, QA, render)
  assets/template/  project Remotion
  styles/           token + catatan buat tiap gaya
```

## Lisensi

MIT - liat [LICENSE](LICENSE). Remotion punya lisensi sendiri: gratis buat individu dan perusahaan kecil, perusahaan yang lebih besar butuh company license. Cek [remotion.dev/license](https://www.remotion.dev/license).

Kredit topik dan tools di video contoh: [CREDITS.md](CREDITS.md).

## Output sosial 1:1, 4:5, 9:16

Satu komposisi responsif bisa diekspor ke tiga kanvas asli (1080x1080 IG feed, 1080x1350 IG feed, 1080x1920 TikTok). Teks, hero, kredit, dan end card pindah posisi, bukan sekadar crop tengah. Jalankan `render --all-formats`; untuk Reels gunakan `--format 9:16 --platform reels` terpisah. Lihat [panduan format dan batasannya](skills/motioncraft/references/social-formats.md). UI aplikasi bisa berubah, jadi cek tiap ekspor di aplikasi sebelum upload.

### SFX otomatis dari data animasi

`motioncraft sfx auto --board storyboard.json --timeline public/timeline.json --out audio/auto-cues.json` bikin cue jarang dari headline dan pergantian scene, lalu event animasi terstruktur (teks, transisi, klik UI, check, logo reveal). Timeline opsional; aksi UI/logo tidak ditebak dari deskripsi. `scene.events` tetap bisa override penuh (`[]` berarti sengaja hening). Dengarkan dan cek hasil sebelum rilis: alat ini belum membaca sembarang kode animasi Remotion atau menilai apakah suaranya cocok. Lihat [panduan timeline audio](skills/motioncraft/references/phase2-timeline-audio.md).

### Editor timeline

Jalankan `motioncraft timeline init launch --out timeline-launch.json`, lalu `timeline edit --board timeline-launch.json --grid audio/beatgrid.json --out timeline-editor.html`. Di halaman lokal, geser blok scene, ubah durasi dan offset penanda beat. Render `TimelineLaunch` dengan `--timeline storyboard.edited.json --grid beatgrid.edited.json`; untuk tutorial gunakan `tutorial` dan `TimelineTutorial`. Dua komposisi ini mengikuti urutan dan durasi baru tanpa edit kode. Komposisi lama `Main`, `MainVertical`, `ProductLaunch`, dan `ScreenTutorial` sekarang juga menerima hasil `timeline init main|product-launch|screen-tutorial` melalui `--timeline`: adegan lama disusun ulang dan di-retime dari frame sumber. Teks/visual masih di kode; headline di JSON tidak mengganti copy. Jalankan `timeline audio --original timeline-launch.json --edited storyboard.edited.json --grid beatgrid.edited.json --music audio/music.wav --vo audio/vo.wav --outDir audio/retimed` untuk menyusun ulang dan stretch musik/VO per scene; offset beat juga menggeser musik. Setelah itu mix ulang dan dengarkan sambungannya. Footage yang timing-nya terpisah tetap perlu dicek. [Panduan](skills/motioncraft/references/phase1-planning-and-preview.md#reorder-and-retime-the-rendered-video).

### GPU/cloud worker

Untuk 3D berat, `gpu probe` cek apakah GPU terlihat; `worker manifest` dan `worker verify` menyiapkan proyek untuk mesin render pilihanmu. `render --require-gpu --gl angle` menolak software/no-device yang jelas, tapi belum membuktikan Chrome pakai GPU. Tes segmen 3D pendek dan bandingkan waktu GPU vs software di mesin tersebut. Skill ini tidak otomatis membuat VM cloud atau biaya. [Syarat dan batasan](skills/motioncraft/references/gpu-cloud-render.md).
