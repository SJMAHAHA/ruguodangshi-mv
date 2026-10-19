/**
 * Remotion CLI 配置。All options: https://remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// 在没有网络下载 Chrome Headless Shell 的环境里，可用环境变量指定本机浏览器：
// REMOTION_BROWSER=/path/to/chrome npx remotion render
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
