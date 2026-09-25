const {board,grid}=JSON.parse(document.getElementById('data').textContent);
const list=document.getElementById('list'),error=document.getElementById('error'),summary=document.getElementById('summary');
let order=board.scenes.map(s=>s.id);const scenes=new Map(board.scenes.map(s=>[s.id,s]));let duration=Object.fromEntries(board.scenes.map(s=>[s.id,s.end-s.start]));
function draw(){list.replaceChildren();for(const id of order){const s=scenes.get(id),row=document.createElement('div');row.className='row';row.draggable=true;
 const grip=document.createElement('span');grip.className='handle';grip.textContent='☰';row.append(grip);
 const title=document.createElement('span');title.className='name';title.textContent=s.headline||s.role||id;const detail=document.createElement('small');detail.textContent=id;title.append(detail);row.append(title);
 const label=document.createElement('label');label.textContent='Seconds ';const input=document.createElement('input');input.type='number';input.min=.8;input.step=1/board.fps;input.value=duration[id];input.oninput=()=>{duration[id]=input.value;total()};label.append(input);row.append(label);
 for(const [icon,delta] of [['↑',-1],['↓',1]]){const button=document.createElement('button');button.textContent=icon;button.setAttribute('aria-label',`Move ${id} ${delta<0?'up':'down'}`);button.onclick=()=>move(id,delta);row.append(button)}
 row.ondragstart=e=>{e.dataTransfer.setData('text/plain',id);row.classList.add('dragging')};row.ondragend=()=>row.classList.remove('dragging');row.ondragover=e=>e.preventDefault();row.ondrop=e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain');if(from!==id&&scenes.has(from)){order=order.filter(x=>x!==from);order.splice(order.indexOf(id),0,from);draw()}};
 list.append(row)}total()}
function move(id,delta){const i=order.indexOf(id),j=i+delta;if(j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];draw()}
function total(){let n=order.reduce((sum,id)=>sum+Number(duration[id]||0),0);summary.textContent=`Total: ${n.toFixed(2)}s (${Math.round(n*board.fps)} frames at ${board.fps} fps)`}
function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
document.getElementById('export').onclick=()=>{try{
 const fps=Number(board.fps),offset=Number(document.getElementById('beat').value);if(!Number.isFinite(offset)||Math.abs(offset)>60)throw Error('Beat offset must be between -60 and 60 seconds');if(!grid&&offset)throw Error('Add --grid when opening this editor to shift beats');
 let frame=0;const edited=order.map(id=>{const s=scenes.get(id),seconds=Number(duration[id]),frames=Math.round(seconds*fps);if(!Number.isFinite(seconds)||seconds<.8||!Number.isSafeInteger(frames))throw Error(`Invalid duration: ${id}`);
 const start=Number(s.start),length=Number(s.end)-start;if(!(length>0))throw Error(`Invalid original scene: ${id}`);const shift=t=>+(frame/fps+(Number(t)-start)*frames/fps/length).toFixed(3);
 const remap=e=>{const out={...e};for(const key of ['at','t'])if(e[key]!=null)out[key]=shift(e[key]);if(e.frame!=null)out.frame=Math.round(shift(Number(e.frame)/fps)*fps);return out};
 const ratio=(s.previewFrame-s.fromFrame)/(s.toFrame-s.fromFrame);const out={...s,fromFrame:frame,toFrame:frame+frames,start:+(frame/fps).toFixed(3),end:+((frame+frames)/fps).toFixed(3),previewFrame:frame+Math.min(frames-1,Math.max(0,Math.round((Number.isFinite(ratio)?ratio:.7)*frames)))};
 if(Array.isArray(s.events))out.events=s.events.map(remap);if(Array.isArray(s.animations))out.animations=s.animations.map(remap);frame+=frames;return out});
 const length=+(frame/fps).toFixed(3);download('storyboard.edited.json',{...board,duration:length,scenes:edited});if(grid){const shift=t=>+(Number(t)+offset).toFixed(3);download('beatgrid.edited.json',{...grid,duration:length,beatOffset:offset,beats:(grid.beats||[]).map(shift).filter(t=>Number.isFinite(t)&&t>=0&&t<length),sections:Array.isArray(grid.sections)?grid.sections.map(s=>typeof s==='number'?shift(s):{...s,t:s.t==null?s.t:shift(s.t)}):grid.sections})}
 error.textContent='Exported. Run timeline audio with the original and edited boards, then re-mix and review audio before rendering.';
 }catch(e){error.textContent=e.message}};
draw();
