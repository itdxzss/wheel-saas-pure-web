export type GroupClassification =
  | "UNCLASSIFIED"
  | "HISTORICAL"
  | "POST_CONTROL";

export interface GroupClassificationProjection {
  groupClassification?: unknown;
  isHistorical?: boolean | null;
  isPostControl?: boolean | null;
}

export type CanonicalGroupClassificationRow<
  T extends GroupClassificationProjection
> = Omit<T, keyof GroupClassificationProjection> & {
  groupClassification: GroupClassification;
};

function isGroupClassification(value: unknown): value is GroupClassification {
  return (
    value === "UNCLASSIFIED" ||
    value === "HISTORICAL" ||
    value === "POST_CONTROL"
  );
}

/**
 * Canonical value wins. During the one-release compatibility window, only an
 * unambiguous legacy projection is accepted; dual-true/dual-false never picks a side.
 */
export function resolveGroupClassification(
  projection: GroupClassificationProjection
): GroupClassification {
  if (isGroupClassification(projection.groupClassification)) {
    return projection.groupClassification;
  }
  if (projection.groupClassification != null) return "UNCLASSIFIED";

  const historical = projection.isHistorical === true;
  const postControl = projection.isPostControl === true;
  if (historical === postControl) return "UNCLASSIFIED";
  return historical ? "HISTORICAL" : "POST_CONTROL";
}

/** Removes the legacy fields after resolving the single UI-facing value. */
export function normalizeGroupClassificationRow<
  T extends GroupClassificationProjection
>(row: T): CanonicalGroupClassificationRow<T> {
  const { groupClassification, isHistorical, isPostControl, ...rest } = row;
  return {
    ...rest,
    groupClassification: resolveGroupClassification({
      groupClassification,
      isHistorical,
      isPostControl
    })
  };
}
