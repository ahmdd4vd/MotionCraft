"""Word timestamps with faster-whisper. Usage: whisper_words.py audio out.json [lang|auto] [model]"""
import json, sys
from faster_whisper import WhisperModel
audio, out = sys.argv[1], sys.argv[2]
lang = None if len(sys.argv) < 4 or sys.argv[3] == 'auto' else sys.argv[3]
model = WhisperModel(sys.argv[4] if len(sys.argv) > 4 else 'small', device='auto', compute_type='int8')
segs, info = model.transcribe(audio, language=lang, word_timestamps=True, vad_filter=True)
words, text = [], []
for s in segs:
    text.append(s.text.strip())
    for w in (s.words or []):
        words.append({'w': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3), 'p': round(w.probability, 2)})
json.dump({'mode': 'word', 'language': info.language, 'text': ' '.join(text), 'words': words}, open(out, 'w'), ensure_ascii=False, indent=1)
