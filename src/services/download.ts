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

export async function downloadOutfitImages(images: Array<{ url?: string; date: string }>) {
  const available = images.filter((image): image is { url: string; date: string } => Boolean(image.url));
  if (!available.length) throw new Error('暂无可下载图片');
  for (const image of available) {
    await downloadRemoteImage(image.url, `daily-style-${image.date}.jpg`);
  }
  return available.length;
}
