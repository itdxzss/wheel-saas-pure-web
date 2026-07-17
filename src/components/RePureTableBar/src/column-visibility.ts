export interface ColumnVisibility {
  hide?: boolean;
  hideable?: boolean;
}

export function isColumnHideable(column: ColumnVisibility): boolean {
  return column.hideable !== false;
}

export function updateAllColumnVisibility<T extends ColumnVisibility>(
  columns: T[],
  visible: boolean
): void {
  columns.forEach(column => {
    column.hide = isColumnHideable(column) ? !visible : false;
  });
}
