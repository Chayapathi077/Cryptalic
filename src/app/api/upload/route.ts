import { NextResponse } from "next/server";

/**
 * Legacy single-request upload. Prefer the two-step flow:
 * 1. Encrypt in browser → POST /api/upload/pinata
 * 2. POST /api/upload/register with metadata
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Use the dashboard upload form (encrypts locally, then uploads). If you see this, refresh the page.",
    },
    { status: 410 }
  );
}
