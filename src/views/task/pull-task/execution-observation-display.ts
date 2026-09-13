import type { PullTaskExecutionObservation } from "@/api/pull-task";

/** 波次/批次是业务阶段下的补充说明，不覆盖阶段名称。 */
export function observationBatchLabel(
  observation?: PullTaskExecutionObservation | null
): string {
  if (!observation?.waveNo) return "";
  const wave = `第 ${observation.waveNo} 轮`;
  if (!observation.callSeq) return wave;
  const total = observation.plannedCallCount
    ? `（共 ${observation.plannedCallCount} 批）`
    : "";
  return `${wave} / 第 ${observation.callSeq} 批${total}`;
}

function duration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
  return `${Math.floor(seconds / 3600)} 小时 ${Math.floor((seconds % 3600) / 60)} 分`;
}

/** 只按服务端快照计算时间，避免页面旧数据继续跳秒而伪装实时。 */
export function observationTimeLines(
  observation?: PullTaskExecutionObservation | null
): string[] {
  if (!observation) return [];
  const lines: string[] = [];
  if (observation.waitStartedAt != null) {
    const elapsed = observation.observedAt - observation.waitStartedAt;
    lines.push(
      elapsed >= 0
        ? `截至本次刷新，已等待 ${duration(elapsed)}`
        : "等待起点晚于取样时间，暂无法计算"
    );
  } else if (
    [
      "WAIT_RESOURCE",
      "WAIT_RESULT",
      "WAIT_ACTION_RESULT",
      "WAIT_APPROVAL"
    ].includes(observation.state)
  ) {
    lines.push("等待起点未记录");
  }
  if (
    observation.nextDispatchAt != null &&
    observation.nextDispatchAt > observation.observedAt
  ) {
    lines.push(
      `下批最早 ${duration(observation.nextDispatchAt - observation.observedAt)}后可执行`
    );
  } else if (observation.nextCheckAt != null) {
    const delay = observation.nextCheckAt - observation.observedAt;
    lines.push(
      delay > 0 ? `下次调度检查：${duration(delay)}后` : "已到可调度检查时间"
    );
  }
  return lines;
}

/** 颜色仅标识观察说明，不改变原业务标签的颜色。 */
export function observationTagType(
  state: string
): "warning" | "info" | "primary" {
  if (
    [
      "BATCH_INCONSISTENT",
      "UNOBSERVED",
      "WAIT_RESOURCE",
      "WAIT_APPROVAL"
    ].includes(state)
  )
    return "warning";
  if (["FINISHED", "PAUSED", "TASK_BLOCKED"].includes(state)) return "info";
  return "primary";
}
