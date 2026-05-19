import { createCipheriv } from "crypto";

/** Zero IV — matches existing client decrypt configuration. */
const IV = Buffer.alloc(16, 0);

/**
 * Encrypts a file buffer with AES-256-CBC and returns base64 ciphertext.
 * Server-side only (Node.js crypto).
 */
export function encryptFileBuffer(
  data: Buffer,
  decryptionKeyHex: string
): string {
  const key = Buffer.from(decryptionKeyHex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "Decryption key must be 64 hex characters (32 bytes)."
    );
  }

  const cipher = createCipheriv("aes-256-cbc", key, IV);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return encrypted.toString("base64");
}
