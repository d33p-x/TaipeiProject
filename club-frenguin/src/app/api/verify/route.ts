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
      "https://club-frenguin.xyz", // Update with actual URL in production
      "uuid",
      false // not dev mode in production
    );

    // Set minimum age to 18
    configuredVerifier.setMinimumAge(18);

    // Verify the proof
    const result = await configuredVerifier.verify(proof, publicSignals);
    console.log("Verification result:", result);

    if (result.isValid) {
      return NextResponse.json({
        status: "success",
        result: result.isValid,
        // Send back only basic info - no need to expose sensitive data
        age: result.credentialSubject?.age || "Not verified",
      });
    } else {
      return NextResponse.json(
        {
          status: "error",
          result: result.isValid,
          message: "Age verification failed",
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
