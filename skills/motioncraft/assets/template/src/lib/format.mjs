// Shared output geometry. Insets are conservative starting points, not platform guarantees:
// app chrome moves with device, caption length, and account settings.
export const FORMATS = Object.freeze({
  '16:9': {width: 1920, height: 1080, platform: 'wide'},
  '1:1': {width: 1080, height: 1080, platform: 'ig-feed'},
  '4:5': {width: 1080, height: 1350, platform: 'ig-feed'},
  '9:16': {width: 1080, height: 1920, platform: 'tiktok'},
});
export const PLATFORMS = ['wide','ig-feed', 'reels', 'tiktok'];
export function geometry(format = '16:9', platform) {
  const base = FORMATS[format];
  if (!base) throw new Error(`Unknown format ${format}. Use 16:9, 1:1, 4:5 or 9:16.`);
  const target = platform || base.platform;
  if (!PLATFORMS.includes(target)) throw new Error(`Unknown platform ${target}`);
  if(target==='wide' && format!=='16:9') throw new Error('wide requires 16:9');
  if(target!=='wide' && format==='16:9') throw new Error('16:9 requires wide');
  if (target !== 'ig-feed' && target!=='wide' && format !== '9:16') throw new Error(`${target} requires 9:16`);
  const {width:w,height:h} = base;
  // Left, right, top, bottom pixel insets. Keep copy out of common app overlays.
  const insets = target==='wide' ? {left:96,right:96,top:72,bottom:72} : target === 'tiktok' ? {left:72,right:175,top:210,bottom:350} :
    target === 'reels' ? {left:72,right:175,top:190,bottom:340} :
    format === '4:5' ? {left:72,right:72,top:100,bottom:135} :
    {left:72,right:72,top:96,bottom:115};
  const safe = {x:insets.left,y:insets.top,width:w-insets.left-insets.right,height:h-insets.top-insets.bottom};
  return {format,platform:target,width:w,height:h,insets,safe,
    // Three non-overlapping regions inside the safe content rect.
    zones:{top:[0,.26],center:[.27,.78],bottom:[.79,1]}};
}
