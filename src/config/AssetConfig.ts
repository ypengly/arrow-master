import type { EnvironmentKind } from '../types/LevelTypes';

export const FONT_FAMILY = "'Trebuchet MS','Segoe UI',Arial,sans-serif";
export const TEX = {
  dot: 'dot', orb: 'orb', coin: 'coin', barrel: 'barrel', crate: 'crate', cover: 'cover', target: 'target',
  pickup: 'pickup', shield: 'shield', bow: 'bow', archerBody: 'archer_body', archerHead: 'archer_head', vignette: 'vignette',
} as const;
export const arrowTex = (kind: string): string => `arrow_${kind}`;
export const enemyBodyTex = (kind: string): string => `body_${kind}`;
export const enemyHeadTex = (kind: string): string => `head_${kind}`;
export const bgTex = (layer: 'sky' | 'far' | 'near' | 'ground', env: EnvironmentKind): string => `bg_${layer}_${env}`;

export type WeatherKind = 'leaves' | 'sand' | 'snow' | 'embers' | 'dust' | 'ash' | 'motes' | 'fog';
export interface EnvTheme {
  name: string; skyTop: number; skyBottom: number; far: number; near: number; ground: number; edge: number;
  weather: WeatherKind; overlay: number; celestial: number;
}
export const ENV_THEMES: Record<EnvironmentKind, EnvTheme> = {
  forest:  { name: 'Forest',  skyTop: 0x7ec8e3, skyBottom: 0xe8f6d4, far: 0x4d8f6a, near: 0x2f6b45, ground: 0x5c8a3a, edge: 0x3d6b25, weather: 'leaves', overlay: 0x335533, celestial: 0xfff3b0 },
  desert:  { name: 'Desert',  skyTop: 0xf5c16c, skyBottom: 0xfde9b8, far: 0xd99a56, near: 0xb87333, ground: 0xe0b36a, edge: 0xc89a4e, weather: 'sand', overlay: 0x7a4a10, celestial: 0xfff8d0 },
  snow:    { name: 'Snow',    skyTop: 0x9fc5e8, skyBottom: 0xeaf4fb, far: 0x8fb4d9, near: 0x5f86b0, ground: 0xf4f8fc, edge: 0xc9dcec, weather: 'snow', overlay: 0x224466, celestial: 0xffffff },
  castle:  { name: 'Castle',  skyTop: 0x4a5a85, skyBottom: 0xa9b4d0, far: 0x56658f, near: 0x3a456b, ground: 0x7a7f8c, edge: 0x5a5f6c, weather: 'dust', overlay: 0x222244, celestial: 0xe8eeff },
  ruins:   { name: 'Ruins',   skyTop: 0xb58c6e, skyBottom: 0xf0d6b5, far: 0x8a6f5a, near: 0x6a5444, ground: 0x8d7a5f, edge: 0x6d5c46, weather: 'dust', overlay: 0x443322, celestial: 0xffe9c0 },
  volcano: { name: 'Volcano', skyTop: 0x3b1010, skyBottom: 0xff7a2a, far: 0x5a2020, near: 0x2b0d0d, ground: 0x3a2a2a, edge: 0xff5a1a, weather: 'embers', overlay: 0x550000, celestial: 0xff9955 },
  dungeon: { name: 'Dungeon', skyTop: 0x10121c, skyBottom: 0x2b3045, far: 0x1f2438, near: 0x14172a, ground: 0x2a2d3a, edge: 0x3d4258, weather: 'fog', overlay: 0x000022, celestial: 0x667799 },
  temple:  { name: 'Temple',  skyTop: 0x2a5b4f, skyBottom: 0xcfe9b8, far: 0x2f7a63, near: 0x1d5c47, ground: 0x6b8f5b, edge: 0x4b7040, weather: 'motes', overlay: 0x114433, celestial: 0xeaffc0 },
};

export interface ManifestEntry { key: string; type: 'image' | 'audio'; url: string }
/** Optional external assets. Leave empty to use the built-in procedural art; entries that fail to load fall back gracefully. */
export const ASSET_MANIFEST: readonly ManifestEntry[] = [];
