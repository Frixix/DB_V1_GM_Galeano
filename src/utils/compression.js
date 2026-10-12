import JSZip from 'jszip';

const COMPRESSIBLE_EXTENSIONS = ['.txt', '.csv', '.tsv', '.json', '.xml', '.html', '.md', '.svg'];

export async function compressFileIfNeeded(file) {
  if (!file) return null;

  const fileName = file.name;
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  const rawBytes = file.size;

  // Solo comprimimos formatos de texto puro menores a 100 MB
  const isCompressible = COMPRESSIBLE_EXTENSIONS.includes(ext) && rawBytes < 100 * 1024 * 1024;

  if (!isCompressible) {
    return {
      file,
      fileName,
      rawBytes,
      compressedBytes: rawBytes,
      ratio: null,
      isCompressed: false,
    };
  }

  try {
    const zip = new JSZip();
    zip.file(fileName, file);
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const compressedBytes = blob.size;
    const savingsRatio = Math.max(0, Math.round((1 - compressedBytes / rawBytes) * 100));

    return {
      file: blob,
      fileName: `${fileName}.zip`,
      rawBytes,
      compressedBytes,
      ratio: `${savingsRatio}%`,
      isCompressed: true,
    };
  } catch (error) {
    console.warn('Compresión fallida, se usa archivo original:', error);
    return {
      file,
      fileName,
      rawBytes,
      compressedBytes: rawBytes,
      ratio: null,
      isCompressed: false,
    };
  }
}
