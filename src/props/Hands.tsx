import React from "react";
import { C } from "../config/palette";
import { MAN } from "../characters/designs";
import { smoothClosed, smoothOpen } from "../lib/geom";
import { SvgImage, Rect } from "../env/Plate";

/**
 * 近景里的手用 Seedream 照着 SVG 手画的水粉贴图（绿底抠成透明 PNG，public/plates/hand_*.png）。
 * 手在镜头里只做平移和旋转，所以贴图和原来的 SVG 手共用同一个原点（笔尖 / 指尖 / 手腕），动作代码不用改。
 * 下面的 *_RECT 是贴图在手的局部坐标里的范围，也是参考底稿的取景范围。
 */
export const PENCIL_RECT: Rect = { x: -160, y: -520, w: 540, h: 660 };
export const POINT_RECT: Rect = { x: -200, y: -40, w: 370, h: 1000 };
export const REACH_RECT: Rect = { x: -340, y: -330, w: 470, h: 1060 };

/** D2 他伸向回忆纸的手：手背朝外、手指伸直（原点 = 手腕附近） */
export const ReachHandSvg: React.FC = () => (
  <g>
    <path
      d={smoothClosed(
        [
          [-60, 60],
          [60, 40],
          [80, 120],
          [40, 700],
          [-300, 700],
          [-200, 200],
        ],
        0.7,
      )}
      fill={MAN.coat}
      stroke={C.graphite}
      strokeWidth={3.5}
    />
    <path
      d={smoothOpen([
        [-50, 80],
        [70, 70],
      ])}
      stroke={C.graphite}
      strokeWidth={3}
    />
    <path
      d={smoothClosed(
        [
          [-58, 64],
          [-70, -40],
          [-50, -120],
          [60, -130],
          [86, -40],
          [66, 50],
        ],
        0.8,
      )}
      fill={MAN.look.skin}
      stroke={C.graphite}
      strokeWidth={3.5}
    />
    {[
      [-46, -110, -56, -250],
      [-6, -124, -8, -290],
      [34, -124, 40, -280],
      [66, -100, 82, -220],
    ].map(([x0, y0, x1, y1], i) => (
      <path
        key={i}
        d={smoothClosed(
          [
            [x0 - 16, y0 + 10],
            [x1 - 12, y1 + 10],
            [x1, y1],
            [x1 + 14, y1 + 12],
            [x0 + 18, y0 + 6],
          ],
          0.8,
        )}
        fill={MAN.look.skin}
        stroke={C.graphite}
        strokeWidth={3.2}
      />
    ))}
    <path
      d={smoothClosed(
        [
          [-66, -20],
          [-120, -80],
          [-150, -140],
          [-130, -150],
          [-80, -100],
          [-50, -60],
        ],
        0.8,
      )}
      fill={MAN.look.skin}
      stroke={C.graphite}
      strokeWidth={3.2}
    />
    <path
      d={smoothClosed(
        [
          [-40, -40],
          [50, -60],
          [60, 20],
          [-30, 30],
        ],
        0.8,
      )}
      fill={MAN.look.skinShade}
      opacity={0.35}
    />
  </g>
);

export const ReachHand: React.FC<{
  x: number;
  y: number;
  angle: number;
  sprite?: string;
}> = ({ x, y, angle, sprite }) => <g transform={`translate(${x},${y}) rotate(${angle})`}>{sprite ? <SvgImage src={sprite} rect={REACH_RECT} /> : <ReachHandSvg />}</g>;

/** A5/A6 握手机的左手（手机局部坐标：手机中心为原点，手机 460×900）。thumb 0..1：拇指沿屏幕左缘往上摩挲 */

export const PhoneHandSvg: React.FC<{ part: "back" | "front"; thumb: number; skin: string; skinShade: string; line: string }> = ({ part, thumb, skin, skinShade, line }) =>
  part === "back" ? (
    <g>
      {/* 左手从下方托住：手掌包住机身左下角，食指、中指指尖从右侧露出 */}
      <path d={smoothClosed([[-250, 250], [-196, 330], [-120, 420], [40, 470], [150, 520], [170, 640], [-60, 660], [-300, 640], [-360, 470], [-330, 330]], 0.85)} fill={skin} stroke={line} strokeWidth={3} />
      <path d={smoothOpen([[-200, 560], [-90, 520], [20, 500]])} stroke={skinShade} strokeWidth={10} fill="none" opacity={0.5} />
      {[[218, 120], [222, 210], [216, 300]].map(([x, y], i) => (
        <path key={i} d={smoothClosed([[x - 24, y - 30], [x + 22, y - 34], [x + 40, y - 6], [x + 30, y + 26], [x - 24, y + 30]], 0.9)} fill={skin} stroke={line} strokeWidth={3} />
      ))}
    </g>
  ) : (
    <g>
      {/* 拇指沿屏幕左缘向上，A5 里轻轻摩挲 */}
      <path d={smoothClosed([[-286, 330], [-262, 210 + thumb * 30], [-226, 120 + thumb * 40], [-196, 112 + thumb * 40], [-192, 160 + thumb * 36], [-210, 260], [-226, 340]], 0.9)} fill={skin} stroke={line} strokeWidth={3} />
      <path d={smoothOpen([[-222, 140 + thumb * 40], [-204, 132 + thumb * 40]])} stroke={line} strokeWidth={2} opacity={0.6} />
    </g>
  );

/** 手 + 手机边框贴图的范围（手机局部坐标） */
export const PHONE_SPRITE_RECT: Rect = { x: -420, y: -480, w: 740, h: 1200 };

/**
 * 握手机的手（水粉贴图）：手连同手机边框一起画，屏幕和背景抠空。
 * 盖在 <Phone> 上面：屏幕内容从抠空的屏幕里透出来，拇指和指尖自然压在手机前面。
 * 拇指的摩挲用两张贴图（拇指在下 / 往上滑一点）交叉淡化。
 */
export const PhoneHand: React.FC<{ thumb: number }> = ({ thumb }) => (
  <g>
    <SvgImage src="plates/hand_phone-a.png" rect={PHONE_SPRITE_RECT} />
    <SvgImage src="plates/hand_phone-b.png" rect={PHONE_SPRITE_RECT} opacity={thumb} />
  </g>
);

/**
 * B3 写字的手（新构图）：从写字人的视角看，右手从画面下方伸进来，笔杆朝右下 / 左下斜，
 * 手在笔尖下方，写过的字露在手的上方。原点 = 笔尖。
 * her：从右下伸进来；him：他坐在她左边，右手从左下伸过来。
 */
export const WRITE_RECT: Record<"her" | "him", Rect> = {
  her: { x: -150, y: -110, w: 600, h: 900 },
  him: { x: -450, y: -110, w: 600, h: 900 },
};
/** 参考底稿用：把原来的握笔手转到新的方向（她：笔杆朝右下；他：朝左下） */
export const WRITE_REF_ANGLE = { her: 113, him: -113 } as const;
