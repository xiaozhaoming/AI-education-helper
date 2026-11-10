/**
 * 单一版本号来源。
 * 升版本时只改这里 + package.json，两处必须一致（项目约定）。
 */
export const APP_VERSION = '1.5.2';
export const APP_VERSION_LABEL = `v${APP_VERSION}`;

/** 本次集成里程碑说明，显示在「Hermes 联调」弹窗里，便于家长/工程师核对当前是第几版 */
export const APP_BUILD_NOTE = '出题引擎 P1：固定 4 梯度配比 + 可复现 seed；答案版 T4 算式修正；换题卷号同步';
