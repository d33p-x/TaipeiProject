import { NextRequest, NextResponse } from "next/server";
import { getUserIdentifier, SelfBackendVerifier } from "@selfxyz/core";

export async function POST(req: NextRequest) {
  try {
    const { proof, publicSignals } = await req.json();

    if (!proof || !publicSignals) {
      return NextResponse.json(
        { message: "Proof and publicSignals are required" },
        { status: 400 }
      );
    }

    const userId = await getUserIdentifier(publicSignals);
    console.log("Extracted userId from verification result:", userId);

    // Configure the verifier with minimum age of 18
    const configuredVerifier = new SelfBackendVerifier(
      "club-frenguin",
      "https://0703-138-199-60-32.ngrok-free.app", // Use same URL as in QR code
      "uuid",
      false // not dev mode in production
    );

    // Set minimum age to 18
    configuredVerifier.setMinimumAge(18);

    // Verify the proof
    const result = await configuredVerifier.verify(proof, publicSignals);
    console.log("Verification result:", result);

    if (result.isValid) {
      // Store the verification result
      try {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_VERCEL_URL ||
            "https://0703-138-199-60-32.ngrok-free.app"
          }/api/verification-status`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              verified: true,
            }),
          }
        );
      } catch (storeError) {
        console.error("Error storing verification result:", storeError);
      }

      return NextResponse.json({
        status: "success",
        result: result.isValid,
        // Send back verification status only
        ageVerified: true,
      });
    } else {
      return NextResponse.json(
        {
          status: "error",
          result: result.isValid,
          message: "Verification failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json(
      {
        message: "Error verifying proof",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
