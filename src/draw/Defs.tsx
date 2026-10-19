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
