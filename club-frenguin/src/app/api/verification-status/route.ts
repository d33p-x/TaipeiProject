import { NextRequest, NextResponse } from "next/server";

// In a real app, you'd use a database or Redis
// For simplicity, we'll use a memory store here
const verificationStore: Record<string, boolean> = {};

// Endpoint to store verification results
export async function POST(req: NextRequest) {
  try {
    const { id, verified } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    verificationStore[id] = !!verified;
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

  return NextResponse.json({
    verified: !!verificationStore[id],
  });
}
