import { getInputProps } from "remotion";
import { Cam } from "../lib/camera";

/**
 * 给 Codex 出参考图用的开关（只在渲染参考图时通过 --props 传入，正式渲染不受影响）：
 *   noPeople  不画人物（以及人物手里的手机），得到空背景
 *   refCam    用指定镜头替换镜头里的镜头运动，让一组参考帧共用同一张画布
 *   refClean  不画雨、玻璃水珠（参考图更干净）
 *   noSubs    不画字幕
 */
type RefProps = { noPeople?: boolean; refCam?: Cam; refClean?: boolean; noSubs?: boolean };
const props = getInputProps() as RefProps;
export const REF_NO_PEOPLE = Boolean(props.noPeople);
export const REF_CAM: Cam | null = props.refCam ?? null;
export const REF_CLEAN = Boolean(props.refClean);
export const REF_NO_SUBS = Boolean(props.noSubs);
