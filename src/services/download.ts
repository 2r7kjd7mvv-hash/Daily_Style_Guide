export async function downloadRemoteImage(url: string, filename = 'daily-style-guide.jpg') {
  if (!url) throw new Error('暂无可下载图片');
  const response = await fetch(url);
  if (!response.ok) throw new Error('图片下载失败');
  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
