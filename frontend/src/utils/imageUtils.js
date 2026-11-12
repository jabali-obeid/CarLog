/**
 * Compresses an image file or base64 data URL using an offscreen canvas.
 * Keeps payloads small (~80-160 KB) for faster Gemini AI analysis, reliable local persistence, and crisp mobile rendering.
 */
export function compressImage(fileOrDataUrl, { maxDim = 1080, quality = 0.78 } = {}) {
  return new Promise((resolve, reject) => {
    const loadSrc = (src) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      loadSrc(fileOrDataUrl);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => loadSrc(reader.result);
    reader.onerror = () => reject(new Error('Error leyendo el archivo de imagen.'));
    reader.readAsDataURL(fileOrDataUrl);
  });
}

/**
 * Converts a base64 data URL into a Blob for uploading to Supabase Storage.
 */
export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

