import { useCurrentFrame } from "remotion";
import { shot, ShotId } from "./timeline";

/** 镜头内的当前「原曲秒」（全片秒）。镜头放在 <Sequence from={shot(id).from}> 里使用。 */
export const useSongT = (id: ShotId) => {
  const frame = useCurrentFrame();
  return (shot(id).from + frame) / 30;
};
