import React, {createContext, useContext} from 'react';
export type Format = '16:9'|'1:1'|'4:5'|'9:16';
export type Platform = 'wide'|'tiktok'|'reels'|'ig-feed';
export const FormatCtx=createContext<{format:Format;platform:Platform}>({format:'16:9',platform:'wide'});
export const useFormat=()=>useContext(FormatCtx);
