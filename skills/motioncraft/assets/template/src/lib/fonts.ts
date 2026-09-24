// Fonts are loaded here. To change fonts: import another family from @remotion/google-fonts
// (or use @remotion/fonts with a local file in public/fonts) AND update style.json font.display / font.mono.
import {loadFont as loadDisplay} from '@remotion/google-fonts/Figtree';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
loadDisplay('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});
loadMono('normal', {weights: ['400', '500'], subsets: ['latin']});
