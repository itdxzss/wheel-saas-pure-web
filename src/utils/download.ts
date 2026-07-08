export function downloadBlobFile(filename: string, blob: Blob): void {
  // 浏览器侧文件下载只在这里触碰 DOM，并在点击后立即清理节点和 URL。
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
