"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useAccount } from "wagmi";
import { v4 as uuidv4 } from "uuid";

// Define the context type
type AgeVerificationContextType = {
  isAdult: boolean | null;
  isVerifying: boolean;
  verificationId: string | null;
  startVerification: () => void;
  resetVerification: () => void;
};

// Create context with default values
const AgeVerificationContext = createContext<AgeVerificationContextType>({
  isAdult: null,
  isVerifying: false,
  verificationId: null,
  startVerification: () => {},
  resetVerification: () => {},
});

// Hook to use the AgeVerification context
export const useAgeVerification = () => useContext(AgeVerificationContext);

// Session storage keys
const AGE_VERIFICATION_KEY = "club-frenguin-age-verification";
const VERIFICATION_ID_KEY = "club-frenguin-verification-id";

export function AgeVerificationProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [isAdult, setIsAdult] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // Load verification status from session storage on component mount or when address changes
  useEffect(() => {
    if (typeof window === "undefined" || !address) return;

    const storedVerification = sessionStorage.getItem(
      `${AGE_VERIFICATION_KEY}-${address}`
    );
    if (storedVerification) {
      setIsAdult(storedVerification === "true");
    } else {
      setIsAdult(null);
    }
  }, [address]);

  // Start the verification process
  const startVerification = () => {
    if (!address) return;

    const id = uuidv4();
    setVerificationId(id);
    sessionStorage.setItem(VERIFICATION_ID_KEY, id);
    setIsVerifying(true);
  };

  // Reset verification status
  const resetVerification = () => {
    if (!address) return;

    setIsAdult(null);
    setIsVerifying(false);
    setVerificationId(null);
    sessionStorage.removeItem(`${AGE_VERIFICATION_KEY}-${address}`);
    sessionStorage.removeItem(VERIFICATION_ID_KEY);
  };

  // Function to handle successful verification
  const handleVerificationSuccess = (verified: boolean) => {
    if (!address) return;

    setIsAdult(verified);
    setIsVerifying(false);
    sessionStorage.setItem(
      `${AGE_VERIFICATION_KEY}-${address}`,
      verified.toString()
    );
  };

  // API endpoint to handle verification result
  // This would typically be called by the Self Protocol after verification
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Define a global callback function that Self can call
    // @ts-ignore - This is intentionally added to the window object
    window.onSelfVerificationComplete = (result: { isValid: boolean }) => {
      handleVerificationSuccess(result.isValid);
    };

    return () => {
      // @ts-ignore - Cleanup
      delete window.onSelfVerificationComplete;
    };
  }, [address]);

  return (
    <AgeVerificationContext.Provider
      value={{
        isAdult,
        isVerifying,
        verificationId,
        startVerification,
        resetVerification,
      }}
    >
      {children}
    </AgeVerificationContext.Provider>
  );
}
