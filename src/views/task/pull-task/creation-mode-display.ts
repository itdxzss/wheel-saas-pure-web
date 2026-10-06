import type { PullTaskCreationMode } from "@/api/pull-task";
import { standardStageOptions } from "./standard-execution-display";

export function pullTaskCreationModeLabel(mode?: PullTaskCreationMode): string {
  if (mode === "SIMPLE_NEW_GROUP") return "新群模式（新）";
  if (mode === "DIRECT_LINK") return "群链接模式（新）";
  if (mode === "NEW_GROUP") return "新群模式";
  if (mode === "RESOURCE_POOL") return "资源池模式";
  return "群链接模式";
}

export function stagesForCreationMode(
  mode?: PullTaskCreationMode
): typeof standardStageOptions {
  if (mode === "SIMPLE_NEW_GROUP") {
    return [9, 2, 3, 11, 12, 10, 6, 8].map(value => ({
      ...standardStageOptions.find(item => item.value === value)!,
      ...(value === 3 ? { label: "管理员接管" } : {})
    }));
  }
  if (mode === "DIRECT_LINK") {
    return [1, 10, 6, 8].map(
      value => standardStageOptions.find(item => item.value === value)!
    );
  }
  return standardStageOptions.filter(item => item.value !== 10);
}

export function isNewGroupCreationMode(mode?: PullTaskCreationMode): boolean {
  return mode === "NEW_GROUP" || mode === "SIMPLE_NEW_GROUP";
}

export function stageLabelForCreationMode(
  stage?: number | null,
  mode?: PullTaskCreationMode
): string {
  if (mode === "SIMPLE_NEW_GROUP" && stage === 4) return "准备拉手";
  return (
    stagesForCreationMode(mode).find(item => item.value === stage)?.label ?? "-"
  );
}
