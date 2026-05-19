import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

function getMaxUploadBytes(): number {
  const env = process.env.UPLOAD_MAX_BYTES;
  if (env) {
    const parsed = parseInt(env, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return 1024 * 1024 * 1024; // 1 GB default
}

export async function POST(request: Request) {
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    return NextResponse.json(
      { success: false, message: "Pinata API keys are not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const fileName =
      (formData.get("fileName") as string) ||
      (file instanceof File ? file.name : "software.enc");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No encrypted file provided." },
        { status: 400 }
      );
    }

    const maxBytes = getMaxUploadBytes();
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          success: false,
          message: `File is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)} MB.`,
        },
        { status: 413 }
      );
    }

    const pinataBody = new FormData();
    pinataBody.append("file", file, fileName.endsWith(".enc") ? fileName : `${fileName}.enc`);

    const pinataResponse = await fetch(PINATA_URL, {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
      body: pinataBody,
    });

    const pinataData = (await pinataResponse.json()) as {
      IpfsHash?: string;
      error?: string;
    };

    if (!pinataResponse.ok || !pinataData.IpfsHash) {
      const detail =
        pinataData.error ||
        JSON.stringify(pinataData) ||
        `HTTP ${pinataResponse.status}`;
      return NextResponse.json(
        { success: false, message: `Pinata upload failed: ${detail}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      fileUrl: `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`,
    });
  } catch (error) {
    console.error("Pinata upload error:", error);
    const message =
      error instanceof Error ? error.message : "Upload failed unexpectedly.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
