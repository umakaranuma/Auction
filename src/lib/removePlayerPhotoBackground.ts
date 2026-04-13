/**
 * Client-only background removal for player portraits (runs ONNX in-browser).
 * Dynamic import keeps the heavy bundle off the initial load.
 */

export type BgRemovalProgress = (phase: string, current: number, total: number) => void;

export async function removePlayerPhotoBackground(
  source: File | Blob,
  onProgress?: BgRemovalProgress
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');
  return removeBackground(source, {
    model: 'isnet_quint8',
    output: { format: 'image/png', quality: 1 },
    progress: onProgress,
    debug: false,
    proxyToWorker: false,
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
