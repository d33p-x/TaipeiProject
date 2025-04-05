import { NextRequest, NextResponse } from "next/server";

interface VerificationData {
  verified: boolean;
  gender?: string;
}

// In a real app, you'd use a database or Redis
// For simplicity, we'll use a memory store here
const verificationStore: Record<string, VerificationData> = {};

// Endpoint to store verification results
export async function POST(req: NextRequest) {
  try {
    const { id, verified, gender } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    verificationStore[id] = {
      verified: !!verified,
      gender: gender || null,
    };

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Error storing verification status" },
      { status: 500 }
    );
  }
}

// Endpoint to check verification status
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  const data = verificationStore[id] || { verified: false };

  return NextResponse.json({
    verified: data.verified,
    gender: data.gender,
  });
}
