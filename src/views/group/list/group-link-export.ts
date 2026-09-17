import type { GroupListRow } from "@/api/group";

export type GroupLinkExportFormat = "csv" | "txt";

/** 导出列表当前已知信息，不触发协议刷新。 */
export function buildGroupLinkExport(
  rows: readonly GroupListRow[],
  format: GroupLinkExportFormat
): string {
  const values = [
    ["群组名称", "群组链接"],
    ...rows.map(row => [
      row.groupName || row.waSubject || `群组 ${row.id}`,
      row.inviteUrl || ""
    ])
  ];
  if (format === "txt") {
    return values
      .map(row => row.map(value => value.replace(/[\t\r\n]+/g, " ")).join("\t"))
      .join("\r\n");
  }
  return (
    "\uFEFF" +
    values
      .map(row =>
        row
          .map(value => {
            const safe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
            return `"${safe.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n")
  );
}
