export type Geometry={format:string;platform:string;width:number;height:number;insets:{left:number;right:number;top:number;bottom:number};safe:{x:number;y:number;width:number;height:number};zones:{top:number[];center:number[];bottom:number[]}};
export function geometry(format?:string,platform?:string):Geometry;
