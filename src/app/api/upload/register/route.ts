import { NextResponse } from "next/server";
import { uploadSoftware } from "@/lib/auth";

export const runtime = "nodejs";

/** Saves software metadata after the encrypted file is already on IPFS. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      price,
      fileUrl,
      seller,
      version,
      category,
      licenseType,
      licenseTerms,
      ipLock,
      fingerprintLock,
      decryptionKey,
      originalFileName,
    } = body;

    if (
      !title ||
      price === undefined ||
      !fileUrl ||
      !seller ||
      !version ||
      !licenseType ||
      !category ||
      !licenseTerms ||
      !decryptionKey
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    const softwareResult = await uploadSoftware({
      title,
      description: description ?? "",
      price: parseFloat(String(price)) || 0,
      fileUrl,
      originalFileName: originalFileName ?? undefined,
      seller,
      version,
      category,
      licenseType,
      licenseTerms,
      licensingRules: {
        ipLock: Boolean(ipLock),
        fingerprintLock: fingerprintLock !== false,
      },
      decryptionKey,
    });

    if (softwareResult.success) {
      return NextResponse.json(softwareResult, { status: 200 });
    }

    return NextResponse.json(softwareResult, { status: 500 });
  } catch (error) {
    console.error("Register software error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save software listing.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
