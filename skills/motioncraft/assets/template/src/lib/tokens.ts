// Every visual number comes from here. Change the style by swapping style.json, not by editing components.
import './fonts';
import style from '../style.json';
export const S = style;
export const C = style.color;
export const FONT = `"${style.font.display}", sans-serif`;
export const MONO = `"${style.font.mono}", monospace`;
export const W = style.canvas.width, H = style.canvas.height, FPS = style.canvas.fps;
export const SAFE = style.layout.safe;
