import { NextRequest, NextResponse } from "next/server";
import {
  getUserIdentifier,
  SelfBackendVerifier,
  countryCodes,
} from "@selfxyz/core";
import { SCOPES } from "@/lib/wagmi";

export async function POST(req: NextRequest) {
  try {
    const { proof, publicSignals } = await req.json();

    if (!proof || !publicSignals) {
      return NextResponse.json(
        { success: false, message: "Proof and publicSignals are required" },
        { status: 400 }
      );
    }

    // Extract user ID from the proof
    const userId = await getUserIdentifier(publicSignals);
    console.log("Extracted userId:", userId);

    // Initialize and configure the verifier
    const selfBackendVerifier = new SelfBackendVerifier(
      "https://forno.celo.org", // Celo RPC url
      SCOPES.APP_SCOPE, // Must match the frontend scope
      `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/verify` // This API endpoint URL
    );

    // Set minimum age verification (minimum age in the app is 13)
    selfBackendVerifier.setMinimumAge(13);

    // Verify the proof
    const result = await selfBackendVerifier.verify(proof, publicSignals);

    if (result.isValid) {
      // Extract relevant data
      const { credentialSubject } = result;

      // Return successful verification response
      return NextResponse.json({
        success: true,
        userId: result.userId,
        data: {
          // Clean and standardize the data
          nationality: credentialSubject.nationality || "Unknown",
          gender: credentialSubject.gender || "Unknown",
          dateOfBirth: credentialSubject.date_of_birth || "Unknown",
          ageVerified: !!credentialSubject.older_than,
          olderThan: credentialSubject.older_than || "13",
        },
      });
    } else {
      // Return failed verification response
      return NextResponse.json(
        {
          success: false,
          message: "Verification failed",
          details: result.isValidDetails,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error verifying proof:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
