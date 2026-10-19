/** 固定种子的随机数，所有程序化细节都从这里取，保证同一帧可重复。 */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** 整数哈希 → [0,1) */
export const hash01 = (n: number, seed = 0) => {
  let x = (Math.imul(n | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

/** 平滑一维值噪声，t 为连续值（如秒），返回 [-1,1] */
export const noise1 = (t: number, seed = 0) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash01(i, seed) * 2 - 1;
  const b = hash01(i + 1, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

/** 预生成一组固定的随机对象 */
export const seededList = <T,>(count: number, seed: number, make: (r: () => number, i: number) => T): T[] => {
  const r = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => make(r, i));
};
