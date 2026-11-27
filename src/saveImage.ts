/**
 * Linux Paint — https://github.com/dvytvs/Paint-linux
 * Copyright © 2026 dvytvs (https://github.com/dvytvs)
 * SPDX-License-Identifier: GPL-3.0-only
 */

export type SaveExtension = 'png' | 'jpg' | 'jpeg' | 'webp' | 'bmp';

export function extensionFromPath(filePath: string): SaveExtension {
  const raw = filePath.split('.').pop()?.toLowerCase() || 'png';
  if (raw === 'jpg' || raw === 'jpeg' || raw === 'webp' || raw === 'bmp') return raw;
  return 'png';
}

/**
 * Encodes the canvas into the format implied by the file extension.
 * Chromium can encode PNG/JPEG/WebP itself; BMP is written by hand because
 * the browser has no BMP encoder.
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement, extension: SaveExtension): string {
  if (extension === 'jpg' || extension === 'jpeg') {
    return canvas.toDataURL('image/jpeg', 0.92);
  }
  if (extension === 'webp') {
    return canvas.toDataURL('image/webp', 0.92);
  }
  if (extension === 'bmp') {
    return canvasToBmpDataUrl(canvas);
  }
  return canvas.toDataURL('image/png');
}

function canvasToBmpDataUrl(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // BITMAPFILEHEADER
  bytes[0] = 0x42; // 'B'
  bytes[1] = 0x4d; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelArraySize, true);

  const data = imageData.data;
  for (let y = 0; y < height; y++) {
    const destRow = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dest = destRow + x * 3;
      bytes[dest] = data[src + 2];     // B
      bytes[dest + 1] = data[src + 1]; // G
      bytes[dest + 2] = data[src];     // R
    }
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:image/bmp;base64,${btoa(binary)}`;
}
