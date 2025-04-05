import { NextRequest, NextResponse } from "next/server";
import * as ethers from "ethers";

// Read verifier private key from environment variables
const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY;

// Check if private key is available
if (!VERIFIER_PRIVATE_KEY) {
  console.error("ERROR: VERIFIER_PRIVATE_KEY not set in environment variables");
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { address, timestamp } = body;

    // Validate parameters
    if (!address || !timestamp) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate private key is available
    if (!VERIFIER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Server configuration error - missing private key" },
        { status: 500 }
      );
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(VERIFIER_PRIVATE_KEY);

    // Create hash of message using ethers keccak256 and solidityPacked
    const encodedMessage = ethers.solidityPacked(
      ["address", "string", "uint256"],
      [address, "VERIFIED", timestamp]
    );
    const messageHash = ethers.keccak256(encodedMessage);

    // Sign the hash
    const messageHashBytes = ethers.getBytes(messageHash);
    const signature = await wallet.signMessage(messageHashBytes);

    // Return the signature
    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      address,
    });
  } catch (error) {
    console.error("Error in ENS verification:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
