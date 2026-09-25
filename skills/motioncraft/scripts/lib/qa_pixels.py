"""Sample actual final-frame pixels; OCR warnings are review leads, not proofs."""
import json,sys,subprocess,os,math
from PIL import Image,ImageOps,ImageDraw,ImageFilter
from statistics import mean

inp=json.loads(sys.argv[1]); W=inp['width']; H=inp['height']; samples=[]; thumbs=[]
for item in inp['frames']:
 im=Image.open(item['image']).convert('RGB'); w,h=im.size
 proc=subprocess.run(['tesseract',item['image'],'stdout','tsv'],capture_output=True,text=True)
 words=[]
 if proc.returncode==0:
  for line in proc.stdout.splitlines()[1:]:
   parts=line.split('\t',11)
   if len(parts)<12:continue
   try: left,top,bw,bh=map(int,parts[6:10]); conf=float(parts[10])
   except ValueError:continue
   if conf>=45 and parts[11].strip() and bw>1 and bh>1:words.append((left,top,bw,bh,parts[11].strip()))
 # OCR geometry is not font metrics, but catches apparent small glyphs and crop risks.
 warnings=[]
 for x,y,bw,bh,text in words:
  phoneHeight=bh*360/w
  if phoneHeight<8:warnings.append(f'small text on 360px-wide phone: {text} ({phoneHeight:.1f}px glyph)')
  if x<.025*w or x+bw>.975*w or y<.025*h or y+bh>.975*h:warnings.append(f'text near image edge: {text}')
  if h>w and ((x+bw>.88*w and y>.12*h) or y+bh>.8*h):warnings.append(f'9:16 UI area may cover text: {text}')
 # For likely headline line (largest OCR words), scan a 1.5-glyph-height halo.
 # High luminance-edge density around text suggests busy background, not certain collision.
 headline=[]
 if words:
  largest=max(z[3] for z in words)
  headline=[z for z in words if z[3]>=largest*.72 and z[3]>h*.018]
 if headline:
  x0=min(x for x,y,bw,bh,t in headline);y0=min(y for x,y,bw,bh,t in headline)
  x1=max(x+bw for x,y,bw,bh,t in headline);y1=max(y+bh for x,y,bw,bh,t in headline)
  pad=int(max(15,mean(z[3] for z in headline)*1.25)); rect=(max(0,x0-pad),max(0,y0-pad),min(w,x1+pad),min(h,y1+pad))
  edges=im.convert('L').filter(ImageFilter.FIND_EDGES).crop(rect)
  # Exclude OCR glyphs before measuring neighboring graphics; text's own strokes are not clutter.
  mask=Image.new('L',edges.size,255);brush=ImageDraw.Draw(mask)
  for x,y,bw,bh,text in words:
   brush.rectangle((x-rect[0]-3,y-rect[1]-3,x+bw-rect[0]+3,y+bh-rect[1]+3),fill=0)
  ep=list(edges.getdata());mp=list(mask.getdata());area=sum(z>0 for z in mp)
  dense=sum(1 for e,m in zip(ep,mp) if m and e>65)/max(1,area)
  if dense>.12:warnings.append(f'busy area around apparent headline ({dense:.0%} non-text edge density); inspect spacing against graphics')
 thumb=im.copy();thumb.thumbnail((480,520))
 tile=Image.new('RGB',(500,thumb.height+42),'white');tile.paste(thumb,((500-thumb.width)//2,32));ImageDraw.Draw(tile).text((8,8),f"{item['at']:.2f}s  {len(words)} OCR words  {len(warnings)} flags",fill='black');thumbs.append(tile)
 samples.append({'at':item['at'],'image':item['image'],'ocrWords':len(words),'warnings':warnings[:20],'ocrAvailable':proc.returncode==0})
cols=min(4,len(thumbs));rows=math.ceil(len(thumbs)/cols);height=max(t.height for t in thumbs)
sheet=Image.new('RGB',(cols*500,rows*height),'#ddd')
for i,tile in enumerate(thumbs):sheet.paste(tile,((i%cols)*500,(i//cols)*height))
out=os.path.join(inp['dir'],'critical-sheet.jpg');sheet.save(out,quality=90)
print(json.dumps({'frames':samples,'contactSheet':out}))
