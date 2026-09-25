"""Frame-complete OCR geometry audit of an already-rendered video."""
import json,sys,subprocess,os,re
from PIL import Image
source,w,h,fps,out,flagged_dir=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),float(sys.argv[4]),sys.argv[5],sys.argv[6]
issues=[]; failures=[]
# Stream decoded frames: keep only flagged PNGs instead of gigabytes of intermediates.
ff=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-i',source,'-an','-f','rawvideo','-pix_fmt','rgb24','-vsync','0','-'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
size=w*h*3;idx=0
while True:
 raw=ff.stdout.read(size)
 if not raw:break
 if len(raw)!=size:raise RuntimeError('truncated decoded frame')
 timestamp=round(idx/fps,3)
 image=os.path.join(flagged_dir,'frame-%08d.png'%idx)
 im=Image.frombytes('RGB',(w,h),raw)
 # tesseract accepts stdin image bytes; no disk write for unflagged frames.
 import io
 buf=io.BytesIO();im.save(buf,format='PNG')
 proc=subprocess.run(['tesseract','stdin','stdout','tsv'],input=buf.getvalue(),capture_output=True)
 stderr=proc.stderr.decode('utf8','replace')
 if proc.returncode!=0:
  failures.append({'frame':idx,'at':timestamp,'error':stderr[-160:]});idx+=1;continue
 words=[]
 for line in proc.stdout.decode('utf8','replace').splitlines()[1:]:
  p=line.split('\t',11)
  if len(p)<12:continue
  try: x,y,bw,bh=map(int,p[6:10]);confidence=float(p[10])
  except ValueError:continue
  if confidence>=45 and p[11].strip() and bw>1 and bh>1:words.append((x,y,bw,bh,p[11].strip()))
 warnings=[]
 for x,y,bw,bh,text in words:
  if bh*360/w<8:warnings.append({'type':'tiny_text','text':text,'box':[x,y,bw,bh]})
  if x<.025*w or x+bw>.975*w or y<.025*h or y+bh>.975*h:warnings.append({'type':'clipped_or_edge_text','text':text,'box':[x,y,bw,bh]})
 # Word boxes overlap beyond OCR tolerance; strong lead for inter-layer collision.
 for i,(x,y,bw,bh,text) in enumerate(words):
  for xx,yy,ww,hh,other in words[i+1:]:
   overlap=max(0,min(x+bw,xx+ww)-max(x,xx))*max(0,min(y+bh,yy+hh)-max(y,yy))
   if overlap>min(bw*bh,ww*hh)*.10:warnings.append({'type':'possible_text_collision','text':text+' / '+other,'boxes':[[x,y,bw,bh],[xx,yy,ww,hh]]})
 if warnings:
  im.save(image);issues.append({'frame':idx,'at':timestamp,'image':image,'warnings':warnings[:30]})
 idx+=1
ff.stdout.close()
if ff.wait()!=0:raise RuntimeError('ffmpeg video decode failed: '+ff.stderr.read().decode('utf8','replace')[-400:])
with open(out,'w') as f:json.dump({'framesScanned':idx,'issues':issues,'ocrFailures':failures},f,indent=2)
print(json.dumps({'framesScanned':idx,'flaggedFrames':len(issues),'ocrFailures':len(failures)}))
