import React from "react";

/**
 * 全片共用的 SVG 滤镜。所有噪声使用固定 seed；滤镜在元素自身坐标系内计算，
 * 物体移动时纹理随物体走，不会逐帧“沸腾”。
 *
 * - pencil：线条轻微手抖 + 水粉色块的明暗斑驳（角色、道具用）
 * - pencil-soft：抖动更大，用于背景大形
 * - pencil-wash：水粉晕边（回忆层、光晕）
 */
export const PencilDefs: React.FC<{ id?: string; amount?: number }> = ({ id = "pencil", amount = 2.2 }) => (
  <defs>
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={11} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={amount} xChannelSelector="R" yChannelSelector="G" result="disp" />
      <feTurbulence type="fractalNoise" baseFrequency="0.011 0.018" numOctaves={3} seed={3} result="n2" />
      <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.2 0 0 0 -0.35" result="mott" />
      <feComposite in="mott" in2="disp" operator="in" result="mottIn" />
      <feFlood floodColor="#000000" floodOpacity={0.16} result="dk" />
      <feComposite in="dk" in2="mottIn" operator="in" result="shade" />
      <feMerge>
        <feMergeNode in="disp" />
        <feMergeNode in="shade" />
      </feMerge>
    </filter>
    <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={23} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={amount * 2.4} xChannelSelector="R" yChannelSelector="G" result="disp" />
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves={3} seed={9} result="n2" />
      <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.3 0 0 0 -0.4" result="mott" />
      <feComposite in="mott" in2="disp" operator="in" result="mottIn" />
      <feFlood floodColor="#000000" floodOpacity={0.2} result="dk" />
      <feComposite in="dk" in2="mottIn" operator="in" result="shade" />
      <feMerge>
        <feMergeNode in="disp" />
        <feMergeNode in="shade" />
      </feMerge>
    </filter>
    <filter id={`${id}-wash`} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={5} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={16} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation="1.4" />
    </filter>
    {/* 轮廓光：人物和长椅朝光源一侧的一道亮边 + 背光一侧很淡的暗边（世界坐标里的像素） */}
    <Rim id="rim-night" dx={-5} dy={3} color="#ebe3cc" op={0.5} shade={0.22} />
    <Rim id="rim-dusk" dx={-4} dy={3} color="#dcd6c6" op={0.32} shade={0.18} />
    <Rim id="rim-dawn" dx={5} dy={3} color="#f2dcb6" op={0.45} shade={0.16} />
    <Rim id="rim-day" dx={5} dy={4} color="#fff0cc" op={0.55} shade={0.14} />
    <Rim id="rim-moon" dx={-5} dy={4} color="#dfe6ee" op={0.45} shade={0.24} />
    <filter id="soft-blur-6" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
    <filter id="soft-blur-20" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="20" />
    </filter>
    <filter id="soft-blur-60" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="60" />
    </filter>
  </defs>
);

/**
 * 轮廓光滤镜：把剪影向光源的反方向错开 (dx,dy)，没被盖住的那一条边就是受光边，铺上光的颜色；
 * 反方向错开得更多、模糊得更宽的一条边压一层很淡的暗色，让平涂的人物有一点体积。
 */
const Rim: React.FC<{ id: string; dx: number; dy: number; color: string; op: number; shade: number }> = ({ id, dx, dy, color, op, shade }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
    <feOffset in="SourceAlpha" dx={dx} dy={dy} result="sh" />
    <feComposite in="SourceAlpha" in2="sh" operator="out" result="edge" />
    <feGaussianBlur in="edge" stdDeviation={1.3} result="eb" />
    <feComposite in="eb" in2="SourceAlpha" operator="in" result="ei" />
    <feFlood floodColor={color} floodOpacity={op} />
    <feComposite in2="ei" operator="in" result="rim" />
    <feOffset in="SourceAlpha" dx={-dx * 3} dy={-dy * 2} result="sh2" />
    <feComposite in="SourceAlpha" in2="sh2" operator="out" result="edge2" />
    <feGaussianBlur in="edge2" stdDeviation={6} result="eb2" />
    <feComposite in="eb2" in2="SourceAlpha" operator="in" result="ei2" />
    <feFlood floodColor="#0b1018" floodOpacity={shade} />
    <feComposite in2="ei2" operator="in" result="dark" />
    <feMerge>
      <feMergeNode in="SourceGraphic" />
      <feMergeNode in="dark" />
      <feMergeNode in="rim" />
    </feMerge>
  </filter>
);
