import CryptoJS from "crypto-js";

const ZERO_IV = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");
const ZERO_IV_BYTES = new Uint8Array(16);

const AES_OPTIONS = {
  iv: ZERO_IV,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7,
};

function hexToBytes(hex: string): Uint8Array {
  if (hex.length !== 64) {
    throw new Error("Decryption key must be 64 hex characters.");
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const { words, sigBytes } = wordArray;
  const bytes = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    bytes[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return bytes;
}

/** Encrypt in the browser (AES-256-CBC) — same algorithm as the server, binary output. */
export async function encryptFileInBrowser(
  file: File,
  keyHex: string
): Promise<Blob> {
  const keyBytes = hexToBytes(keyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const plain = await file.arrayBuffer();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: ZERO_IV_BYTES },
    cryptoKey,
    plain
  );

  return new Blob([encrypted], { type: "application/octet-stream" });
}

function looksLikeBase64Ciphertext(bytes: Uint8Array): boolean {
  if (bytes.length < 32) return false;
  const sample = bytes.subarray(0, Math.min(bytes.length, 256));
  for (const byte of sample) {
    const c = String.fromCharCode(byte);
    if (!/[A-Za-z0-9+/=\r\n]/.test(c)) return false;
  }
  return true;
}

async function decryptBinaryCiphertext(
  ciphertext: ArrayBuffer,
  keyHex: string
): Promise<Uint8Array> {
  const keyBytes = hexToBytes(keyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: ZERO_IV_BYTES },
    cryptoKey,
    ciphertext
  );
  return new Uint8Array(decrypted);
}

/** Decrypt legacy base64 ciphertext (older uploads). */
export function decryptBase64Ciphertext(
  encryptedBase64: string,
  keyHex: string
): Uint8Array {
  const key = CryptoJS.enc.Hex.parse(keyHex);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(encryptedBase64),
  });

  let decrypted = CryptoJS.AES.decrypt(cipherParams, key, AES_OPTIONS);

  if (decrypted.sigBytes === 0) {
    decrypted = CryptoJS.AES.decrypt(encryptedBase64, key, AES_OPTIONS);
  }

  if (decrypted.sigBytes === 0) {
    throw new Error(
      "Decryption failed. The key may be wrong or the file may be corrupted."
    );
  }

  return wordArrayToUint8Array(decrypted);
}

/**
 * Decrypt IPFS payload — supports binary .enc (new) and base64 text (legacy).
 */
export async function decryptCiphertextBuffer(
  data: ArrayBuffer,
  keyHex: string
): Promise<Uint8Array> {
  const bytes = new Uint8Array(data);

  if (looksLikeBase64Ciphertext(bytes)) {
    const asText = new TextDecoder("ascii").decode(bytes).trim();
    try {
      return decryptBase64Ciphertext(asText, keyHex);
    } catch {
      // fall through to binary decrypt
    }
  }

  try {
    return await decryptBinaryCiphertext(data, keyHex);
  } catch {
    const asText = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
    if (asText.length > 0) {
      return decryptBase64Ciphertext(asText, keyHex);
    }
    throw new Error(
      "Decryption failed. The key may be wrong or the file may be corrupted."
    );
  }
}

/** @deprecated Use decryptCiphertextBuffer — kept for compatibility */
export function decryptFileToBytes(
  encryptedBase64: string,
  keyHex: string
): Uint8Array {
  return decryptBase64Ciphertext(encryptedBase64, keyHex);
}

export function isLikelyText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  const sample = bytes.subarray(0, Math.min(bytes.length, 8192));

  let control = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 9 || (byte > 13 && byte < 32)) control++;
  }

  return control / sample.length < 0.05;
}

export function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function mimeTypeForFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".js")) return "text/javascript";
  if (lower.endsWith(".ts")) return "text/typescript";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain";
  if (lower.endsWith(".exe")) return "application/octet-stream";
  return "application/octet-stream";
}

function isIpfsPathSegment(segment: string): boolean {
  const name = segment.replace(/\.enc$/i, "");
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(name) || name.startsWith("bafy");
}

export function fileNameFromEncryptedUrl(encryptedFileUrl: string): string {
  const segment = encryptedFileUrl.substring(
    encryptedFileUrl.lastIndexOf("/") + 1
  );
  const name = segment.replace(/\.enc$/i, "");
  if (isIpfsPathSegment(name)) return "";
  return name;
}

/** Guess file extension from magic bytes when the name was lost (IPFS URL only). */
export function detectExtensionFromBytes(bytes: Uint8Array): string | null {
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) return "zip";
  if (bytes.length >= 4 && bytes[0] === 0x7f && bytes[1] === 0x45) return "elf";
  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) return "exe";
  if (bytes.length >= 8) {
    const head = decodeText(bytes.subarray(0, 8));
    if (head.startsWith("%PDF")) return "pdf";
  }
  return null;
}

export function resolveDecryptedFileName(
  options: {
    fileName?: string;
    softwareTitle?: string;
    encryptedFileUrl: string;
    bytes: Uint8Array;
  }
): string {
  const { fileName, softwareTitle, encryptedFileUrl, bytes } = options;

  if (fileName && !isIpfsPathSegment(fileName)) {
    return fileName;
  }

  const fromUrl = fileNameFromEncryptedUrl(encryptedFileUrl);
  if (fromUrl) return fromUrl;

  const ext = detectExtensionFromBytes(bytes);
  const base = (softwareTitle || "software").replace(/\s+/g, "_");
  return ext ? `${base}.${ext}` : `${base}.bin`;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Upload encrypted blob with real XMLHttpRequest progress. */
export function uploadEncryptedToPinata(
  blob: Blob,
  fileName: string,
  onProgress: (percent: number) => void
): Promise<{ fileUrl: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("fileName", fileName);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress((event.loaded / event.total) * 100);
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const result = JSON.parse(xhr.responseText) as {
          success?: boolean;
          fileUrl?: string;
          message?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && result.success && result.fileUrl) {
          resolve({ fileUrl: result.fileUrl });
        } else {
          reject(new Error(result.message || `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled."));
    });

    xhr.open("POST", "/api/upload/pinata");
    xhr.send(formData);
  });
}
