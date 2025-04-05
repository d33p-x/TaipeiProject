Self Protocol
Verify real users while preserving privacy.

Overview
Self is a privacy-first, open-source identity protocol that uses zero-knowledge proofs for secure identity verification. 

It enables Sybil resistance and selective disclosure using real-world attestations like passports. With a few lines of code, developers can easily check if their users are humans, while preserving their privacy.

How it Works
Self Protocol simplifies digital identity verification with zero-knowledge proofs in three steps:

Scan Your Passport: Scan your passport using the NFC reader of your phone.

Generate a Proof: Generate a zk proof over your passport, selecting only what you want to disclose.

Share Your Proof: Share your zk proof with the selected application.

Common use cases for Self:
Airdrop protection: Protect a token distribution from bots

Social media: Add humanity checks to user's profiles

Quadratic funding: Prevent farmers from skewing rewards

Wallet recovery: Safeguard assets using IDs as recovery sources

Sanction list checking: Check users are not on sanctioned entity lists

Use Self
Quickstart
To use Self in your web app, you will display QR codes to request proofs from your front-end, then verify them in your back-end or onchain. This means you will integrate two SDKs:

The front-end SDK generates and displays QR codes containing information from your app and what you want users to disclose.

The back-end SDK verifies proofs on a node server (as in this quickstart) or directly onchain.

Add SelfBackendVerifier to your back-end
Requirements
Node v16

Install dependencies
npm
yarn
bun
Copy
npm install @selfxyz/core 
Set Up SelfBackendVerifier
To set up the SelfBackendVerifier , pass a Celo RPC Url, a scope that uniquely identifies your application and the url of your server.

Note that the third argument to the SelfBackendVerifieris the endpoint of the server you're currently working on. This is NOT localhost. You must either set up a DNS and pass that or if you're developing locally, you must tunnel the localhost endpoint using ngrok.

Copy
import { SelfBackendVerifier } from '@selfxyz/core';

const selfBackendVerifier = new SelfBackendVerifier(
    "https://forno.celo.org", // Celo RPC url, we recommend using Forno
    "my-app-scope", // the scope that you chose to identify your app
    "https://myapp.com/api/verify" // The API endpoint of this backend
);
Verification
To verify proofs, call the verify method.

Copy
import { SelfVerificationResult } from '@selfxyz/core';

const result: SelfVerificationResult = await selfBackendVerifier.verify(request.body.proof, request.body.publicSignals);
This is the format the API returns:

Copy
response: {
    200: t.Object({
        status: t.String(),
        result: t.Boolean(),
    }),
    500: t.Object({
        status: t.String(),
        result: t.Boolean(),
        message: t.String(),
    }),
},
Example API implementation
This is how an example API implementation would look like this: 

Copy
import { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdentifier, SelfBackendVerifier, countryCodes } from '@selfxyz/core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { proof, publicSignals } = req.body;

      if (!proof || !publicSignals) {
        return res.status(400).json({ message: 'Proof and publicSignals are required' });
      }

      // Extract user ID from the proof
      const userId = await getUserIdentifier(publicSignals);
      console.log("Extracted userId:", userId);

      // Initialize and configure the verifier
      const selfBackendVerifier = new SelfBackendVerifier(
        'my-application-scope', 
        'https://myapp.com/api/verify'
      );

      // Verify the proof
      const result = await selfBackendVerifier.verify(proof, publicSignals);
      
      if (result.isValid) {
        // Return successful verification response
        return res.status(200).json({
          status: 'success',
          result: true,
          credentialSubject: result.credentialSubject
        });
      } else {
        // Return failed verification response
        return res.status(500).json({
          status: 'error',
          result: false,
          message: 'Verification failed',
          details: result.isValidDetails
        });
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
      return res.status(500).json({
        status: 'error',
        result: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
Add the QR code generator to your front-end
QRCodeGenerator is a React component for generating QR codes for Self passport verification.

Installation
npm
yarn
bun
Copy
npm install @selfxyz/qrcode
Basic Usage
1. Import the SelfQRcode component
Copy
import SelfQRcodeWrapper, { SelfAppBuilder, SelfQRcode } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';
2. Create a SelfApp instance using SelfAppBuilder 
Copy
// Generate a unique user ID
const userId = uuidv4();

// Create a SelfApp instance using the builder pattern
const selfApp = new SelfAppBuilder({
  appName: "My App",
  scope: "my-app-scope", 
  endpoint: "https://myapp.com/api/verify",
  endpointType: "https",
  logoBase64: "<base64EncodedLogo>", // Optional, accepts also PNG url
  userId,
}).build();
Note that if you're choosing the endpointType to be https , the endpoint field must be accessible for anyone to call it (i.e., not localhost). The reason is that the Self backend relayer calls this endpoint to verify the proof.

Be careful and use the same scope here as you used in the backend code shown above.

3. Render the QR code component
Copy
function MyComponent() {
  return (
    <SelfQRcodeWrapper
      selfApp={selfApp}
      onSuccess={() => {
        console.log('Verification successful');
        // Perform actions after successful verification
      }}
    />
  );
}
SelfQRcodeWrapper wraps SelfQRcode to prevent server-side rendering when using nextjs. When not using nextjs, SelfQRcode can be used instead.

Your scope is an identifier for your application. It makes sure people can't use proofs destined for other applications in yours. You'll have to use the same scope in the backend verification SDK if you need to verify proofs offchain, or in your contract if you verify them onchain. Make sure it's no longer than 25 characters.

The userId is the unique identifier of your user. It ties them to their proof. You want to verify the proof offchain, you can use a standard uuid. If you want to verify it onchain, you should use the user's address so no one can steal their proof and use it with another address.

To see how you can configure your SelfApp  take a look atSelfAppBuilder. You can also find the SDK reference forSelfQRcodeWrapper.

Complete Example
Here's a complete example of how to implement the Self QR code in a NextJS application:

Copy
'use client';

import React, { useState, useEffect } from 'react';
import SelfQRcodeWrapper, { SelfAppBuilder } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';

function VerificationPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Generate a user ID when the component mounts
    setUserId(uuidv4());
  }, []);

  if (!userId) return null;

  // Create the SelfApp configuration
  const selfApp = new SelfAppBuilder({
    appName: "My Application",
    scope: "my-application-scope",
    endpoint: "https://myapp.com/api/verify",
    userId,
  }).build();

  return (
    <div className="verification-container">
      <h1>Verify Your Identity</h1>
      <p>Scan this QR code with the Self app to verify your identity</p>
      
      <SelfQRcodeWrapper
        selfApp={selfApp}
        onSuccess={() => {
          // Handle successful verification
          console.log("Verification successful!");
          // Redirect or update UI
        }}
        size={350}
      />
      
      <p className="text-sm text-gray-500">
        User ID: {userId.substring(0, 8)}...
      </p>
    </div>
  );
}

export default VerificationPage;
Example
For a more comprehensive and interactive example, please refer to the playground.

Verification Flow
Your application displays the QR code to the user

The user scans the QR code with the Self app

The Self app guides the user through the passport verification process

The proof is generated and sent to your verification endpoint

Upon successful verification, the onSuccess callback is triggered

The QR code component displays the current verification status with an LED indicator and changes its appearance based on the verification state.

Disclosures
Disclosures allow you to reveal information about your passport. For example, if you want to check if a user is above the age of 18 then at the very least you will end up disclosing the lower bound of the age range of the user.

How to set the minimum age
In your QRCode component, you must first make sure that you disclose the minimum age before sending it to our servers to generate the proof. 

Copy
import { SelfAppBuilder } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';

const userId = uuidv4();
​
const selfApp = new SelfAppBuilder({
  appName: "My App",
  scope: "my-app-scope", 
  endpoint: "https://myapp.com/api/verify",
  endpointType: "https",
  logoBase64: "<base64EncodedLogo>",
  userId,
  disclosures: {
    minimumAge: 18,
  }
}).build();
Once you've made the changes in the frontend, you can change your backend verifier to make use of  the SelfBackendVerifier ,checking for the minimum age is as simple as: 

Copy
selfBackendVerifier.setMinimumAge(18);
Note that for all types of disclosures, the frontend and backend have to be consistent. For example, if you create a proof from the frontend to disclose a minimum age of 17 and configure the backend to accept proofs with a minimum age of 16, verification fails.

Take a look at SelfBackendVerifier for the different types of methods you can use to configure the SelfBackendVerifier.

If you want to add your own custom checks for verifying users, then you can use the verify function to get all the disclosed attributes of the proof. The result of the verify function is.

Copy
export interface SelfVerificationResult {
  // Check if the whole verification has succeeded
  isValid: boolean;
  isValidDetails: {
    // Verifies that the proof is generated under the expected scope.
    isValidScope: boolean;
    //Check that the proof's attestation identifier matches the expected value.
    isValidAttestationId: boolean;
    // Verifies the cryptographic validity of the proof.
    isValidProof: boolean;
    // Ensures that the revealed nationality is correct (when nationality verification is enabled).
    isValidNationality: boolean;
  };
  // User Identifier which is included in the proof
  userId: string;
  // Application name, which is the same as scope
  application: string;
  // A cryptographic value used to prevent double registration or reuse of the same proof.
  nullifier: string;
  // Revealed data by users
  credentialSubject: {
    // Merkle root, which is used to generate proof.
    merkle_root?: string;
    // Proved identity type. For passport, this value is fixed as 1.
    attestation_id?: string;
    // Date when the proof is generated
    current_date?: string;
    // Revealed issuing state in the passport
    issuing_state?: string;
    // Revealed name in the passport
    name?: string;
    // Revealed passport number in the passport
    passport_number?: string;
    // Revealed nationality in the passport
    nationality?: string;
    // Revealed date of birth in the passport
    date_of_birth?: string;
    // Revealed gender in the passport
    gender?: string;
    // Revealed expiry date in the passport
    expiry_date?: string;
    // Result of older than
    older_than?: string;
    // Result of passport number ofac check
    // Gives true if the user passed the check (is not on the list),
    // false if the check was not requested or if the user is in the list
    passport_no_ofac?: boolean;
    // Result of name and date of birth ofac check
    name_and_dob_ofac?: boolean;
    // Result of name and year of birth ofac check
    name_and_yob_ofac?: boolean;
  };
  proof: {
    // Proof that is used for this verification
    value: {
      proof: Groth16Proof;
      publicSignals: PublicSignals;
    };
  };
The credentialSubject field includes all the disclosed attributes. If you did not configure to disclose a certain attribute, then the value of the field is going to be undefined. 

For example, assuming you disclosed the nationality of the user, then you can add a check in the backend verifier to check that they are not from North Korea. 

Copy
import { countries, SelfVerificationResult } from "@selfxyz/core";

const result: SelfVerificationResult = await selfBackendVerifier.verify(request.body.proof, request.body.publicSignals);
if (result.credentialSubject.nationality === countries.IRAN ) { 
    return res.status(403).json({
          status: 'failure',
          result: false,
    });
}

Use deeplinking
Integrate Self protocol inside your mobile application using Deeplinking

Import getUniversalLink and  SelfAppBuilder from @selfxyz/core

Copy
import {getUniversalLink, SelfAppBuilder } from '@selfxyz/core';
Instantiate your Self app using SelfAppBuilder .

Copy
const selfApp = new SelfAppBuilder({
    appName: <your-app-name>,
    scope: <your-app-scope>,
    endpoint: <your-endpoint>,
    logoBase64: <url-to-a-png>,
    userIdType: 'hex', // only for if you want to link the proof with the user address
    userId: <user-id>, // uuid or user address
}).build();
Get the deeplink from the Self app object.

Copy
 const deeplink = getUniversalLink(selfApp);
You can now use this deeplink to redirect your users to the Self mobile app. If your mobile application uses Kotlin/Java/Swift, reach out to us.

SelfAppBuilder
A React component for generating QR codes for Self passport verification.

The SelfAppBuilder allows you to configure your application's verification requirements:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| appName | string | Yes | The name of your application |
| scope | string | Yes | A unique identifier for your application |
| endpoint | string | Yes | The endpoint that will verify the proof |
| endpointType | celo \| https \| staging_celo \| staging_https | Yes | Whether the endpoint verifies the proofs on chain or off chain |
| logoBase64 | string | No | Base64-encoded logo to display in the Self app |
| userId | string | Yes | Unique identifier for the user |
| userIdType | UserIdType | Yes | Hex implies onchain address whereas uuid implies uuid identification of users. |
| disclosures | object | No | Disclosure and verification requirements |

Disclosure Options
The disclosures object can include the following options:

| Option | Type | Description |
|--------|------|-------------|
| issuing_state | boolean | Request disclosure of passport issuing state |
| name | boolean | Request disclosure of the user's name |
| nationality | boolean | Request disclosure of nationality |
| date_of_birth | boolean | Request disclosure of birth date |
| passport_number | boolean | Request disclosure of passport number |
| gender | boolean | Request disclosure of gender |
| expiry_date | boolean | Request disclosure of passport expiry date |
| minimumAge | number | Verify the user is at least this age |
| excludedCountries | string[] | Array of country codes to exclude |
| ofac | boolean | Enable OFAC compliance check |

SelfBackendVerifier
The SelfBackendVerifier class is designed to facilitate the verification of user credentials and disclosures in applications using the Self system. It supports various modes of operation, allowing for both onchain and offchain proof verification. The class provides methods to configure verification parameters such as minimum age, nationality, and OFAC checks, and to generate intents for user interactions.

Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| scope | string | An identifier for the application, used to distinguish different apps. |
| endpoint | string | The endpoint of the backend verifier. |
| user_identifier_type | UserIdType | The type of the user identifier. Hex denotes on chain addresses. |
| mockPassport | boolean | The passport type - false if the backend is verifying real passports. |

Functions

| Function | Parameters | Description | Output |
|----------|------------|-------------|--------|
| setMinimumAge | age: number | Sets the minimum age requirement for verification. Throws an error if age is less than 10 or more than 100. | this |
| setNationality | country: (typeof countryNames)[number] | Sets the nationality requirement for verification. | this |
| excludeCountries | ...countries: (typeof countryNames)[number][] | Excludes specified countries from verification. | this |
| enablePassportNoOfacCheck | | Checks for the passport number in the OFAC list. | this |
| enableNameAndDobOfacCheck | | Checks for the name and DOB (hashed together) in the OFAC list. | this |
| enableNameAndYobOfacCheck | | Checks for the name and year of birth (hashed together) in the OFAC list. | this |
| verify | proof: OpenPassportAttestation | Verifies a proof against the configured verification parameters. | Promise<OpenPassportVerifierReport> |

SelfQRcodeWrapper
SelfQRcodeWrapper wraps SelfQRcode to prevent server-side rendering when using nextjs. When not using nextjs, SelfQRcode can be used instead.

The SelfQRcodeWrapper component accepts the following props:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| selfApp | SelfApp | Yes | - | The SelfApp configuration object |
| onSuccess | () => void | Yes | - | Callback function executed on successful verification |
| websocketUrl | string | No | WS_DB_RELAYER | Custom WebSocket URL for verification |
| size | number | No | 300 | QR code size in pixels |
| darkMode | boolean | No | false | Enable dark mode styling |
| children | React.ReactNode | No | - | Custom children to render |

Basic Integration
This document provides an overview and integration guide for our smart contract, available as an npm package. You can install it with:

Copy
npm i @selfxyz/contracts
Package Structure and Overview
The package structure and a brief explanation for each part are as follows:

Copy
.
├── abstract
│ └── SelfVerificationRoot.sol # Base impl in self verification
├── constants
│ ├── AttestationId.sol # A unique identifier assigned to the identity documents
│ └── CircuitConstants.sol # Indices for public signals in our circuits
├── interfaces # Interfaces for each contract
│ ├── IDscCircuitVerifier.sol
│ ├── IIdentityRegistryV1.sol
│ ├── IIdentityVerificationHubV1.sol
│ ├── IPassportAirdropRoot.sol
│ ├── IRegisterCircuitVerifier.sol
│ ├── ISelfVerificationRoot.sol
│ └── IVcAndDiscloseCircuitVerifier.sol
└── libraries
├── CircuitAttributeHandler.sol # Library to extract each attribute from public signals
└── Formatter.sol # Utility functions to manage public signals to meaningful format
Basic Integration Strategy
To leverage the apps and infrastructure provided by Self, extend the SelfVerificationRoot contract and use the verifySelfProof function. Since SelfVerificationRoot already contains a simple implementation, you usually won't need to add extra code. For example:

Copy
import {SelfVerificationRoot} from "../abstract/SelfVerificationRoot.sol";

contract Example is SelfVerificationRoot {
    constructor(
        address _identityVerificationHub,
        uint256 _scope, 
        uint256 _attestationId,
        bool _olderThanEnabled,
        uint256 _olderThan,
        bool _forbiddenCountriesEnabled,
        uint256[4] memory _forbiddenCountriesListPacked,
        bool[3] memory _ofacEnabled
    ) 
        SelfVerificationRoot(
            _identityVerificationHub, // Address of our Verification Hub, e.g., "0x77117D60eaB7C044e785D68edB6C7E0e134970Ea"
            _scope, // An application-specific identifier for the integrated contract
            _attestationId, // The id specifying the type of document to verify (e.g., 1 for passports)
            _olderThanEnabled, // Flag to enable age verification
            _olderThan, // The minimum age required for verification
            _forbiddenCountriesEnabled, // Flag to enable forbidden countries verification
            _forbiddenCountriesListPacked, // Packed data representing the list of forbidden countries
            _ofacEnabled // Flag to enable OFAC check
        )
    {} 
}
For more details on the server-side architecture of Self, please refer to the detailed documentation on our website.

How the Integration Works
Application Integration:
In your third-party application (which integrates our SDK), specify the target contract address for verification.

User Interaction:
The user scans their passport on their device. The passport data, along with the contract address specified by your application, is sent to our TEE (Trusted Execution Environment) server.

Proof Generation:
Our TEE server generates a proof based on the passport information and automatically calls the specified contract address.

Fixed Interface:
The called contract uses a fixed interface—the verifySelfProof function in the abstract contract SelfVerificationRoot—ensuring consistency across integrations.

Parameters: olderThan, forbiddenCountries, and ofacEnabled
These parameters serve to both verify the correctness of the Groth16 proof and validate the public signals contained in the proof. The following points summarize their roles:

Verification:
They ensure the proof is valid and that the public signals are correct. This validation is performed by our IdentityVerificationHub.

Configuration:
Set the minimum age (olderThan), the list of forbidden countries, and the type of OFAC check on each contract that integrates our system.

Proof Verification in IdentityVerificationHub
The following Solidity function shows how the IdentityVerificationHub verifies the proof:

Copy
function _verifyVcAndDiscloseProof(
    VcAndDiscloseHubProof memory proof
) 
    internal
    view
    returns (uint256 identityCommitmentRoot)
{
    // verify identity commitment root
    if (!IIdentityRegistryV1(_registry).checkIdentityCommitmentRoot(proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX])) {
        revert INVALID_COMMITMENT_ROOT();
    }

    // verify current date
    uint[6] memory dateNum;
    for (uint256 i = 0; i < 6; i++) {
        dateNum[i] = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_CURRENT_DATE_INDEX + i];
    }

    uint currentTimestamp = Formatter.proofDateToUnixTimestamp(dateNum);
    if(
        currentTimestamp < _getStartOfDayTimestamp() - 1 days + 1 ||
        currentTimestamp > _getStartOfDayTimestamp() + 1 days - 1
    ) {
        revert CURRENT_DATE_NOT_IN_VALID_RANGE();
    }

    // verify attributes
    uint256[3] memory revealedDataPacked;
    for (uint256 i = 0; i < 3; i++) {
        revealedDataPacked[i] = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_REVEALED_DATA_PACKED_INDEX + i];
    }
    if (proof.olderThanEnabled) {
        if (!CircuitAttributeHandler.compareOlderThan(Formatter.fieldElementsToBytes(revealedDataPacked), proof.olderThan)) {
            revert INVALID_OLDER_THAN();
        }
    }
    if (proof.ofacEnabled[0] || proof.ofacEnabled[1] || proof.ofacEnabled[2]) {
        if (!CircuitAttributeHandler.compareOfac(
            Formatter.fieldElementsToBytes(revealedDataPacked),
            proof.ofacEnabled[0],
            proof.ofacEnabled[1],
            proof.ofacEnabled[2]
        )) {
            revert INVALID_OFAC();
        }
        if (!IIdentityRegistryV1(_registry).checkOfacRoots(
            proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_PASSPORT_NO_SMT_ROOT_INDEX],
            proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_NAME_DOB_SMT_ROOT_INDEX],
            proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_NAME_YOB_SMT_ROOT_INDEX]
        )) {
            revert INVALID_OFAC_ROOT();
        }
    }
    if (proof.forbiddenCountriesEnabled) {
        for (uint256 i = 0; i < 4; i++) {
            if (
                proof.forbiddenCountriesListPacked[i] != proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_FORBIDDEN_COUNTRIES_LIST_PACKED_INDEX + i]
            ) {
                revert INVALID_FORBIDDEN_COUNTRIES();
            }
        }
    }

    // verify the proof using the VC and Disclose circuit verifier
    if (!IVcAndDiscloseCircuitVerifier(_vcAndDiscloseCircuitVerifier).verifyProof(proof.vcAndDiscloseProof.a, proof.vcAndDiscloseProof.b, proof.vcAndDiscloseProof.c, proof.vcAndDiscloseProof.pubSignals)) {
        revert INVALID_VC_AND_DISCLOSE_PROOF();
    }

    return proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX];
}
Key Points in Proof Verification
Merkle Tree Usage:
The proof must be generated using the Merkle tree maintained in our registry.

Timestamp Verification:
The proof must have been generated recently, within a valid time window.

Older Than Check:
If enabled, the proof must contain a valid age verification:

For example, if the contract is set to require an age of 18, then a proof generated for a user who is 20 will pass. Conversely, if the contract requires a minimum of 20 and the user's proof indicates 18, the verification will fail.

Forbidden Countries Check:
If enabled, you can specify forbidden nationalities.

The forbidden countries are represented as a packed list of three-letter country codes.

For gas efficiency, the check is performed on the packed data without unpacking.

Ensure that the order of the forbidden countries specified in your integrated application matches the forbiddenCountriesListPacked value in the contract.

OFAC Check:
Self supports OFAC checks against the U.S. Treasury's sanctions list.

There are multiple OFAC verification methods:

ofacEnabled[0]: OFAC check using passport number.

ofacEnabled[1]: OFAC check using name and date of birth.

ofacEnabled[2]: OFAC check using name and year of birth.

Configure your contract to enable the same OFAC checks as those enabled in your application.

Enabled Flags:
The flags (olderThanEnabled, forbiddenCountriesEnabled, and ofacEnabled) allow you to save gas by skipping unnecessary verifications.

By following this guide, you should be able to integrate our smart contract into your application while maintaining flexibility over age restrictions, forbidden country checks, and OFAC verifications.

Feel free to adjust or extend the code and configuration according to your application's needs.

Airdrop Example
Let's take a closer look at how to integrate our smart contract by using a concrete example. In this case, we will demonstrate how to integrate our Airdrop contract.

Importing Required Files
In the Airdrop contract, we override the verifySelfProof function to add custom functionality. For this purpose, import the following files:

Copy
import {SelfVerificationRoot} from "../abstract/SelfVerificationRoot.sol";
import {IVcAndDiscloseCircuitVerifier} from "../interfaces/IVcAndDiscloseCircuitVerifier.sol";
import {IIdentityVerificationHubV1} from "../interfaces/IIdentityVerificationHubV1.sol";
import {CircuitConstants} from "../constants/CircuitConstants.sol";
Verification Requirements for the Airdrop
For the Airdrop use case, the following verification checks are required:

Scope Verification:
Confirm that the proof was generated specifically for the Airdrop application by checking the scope used in the proof.

Attestation ID Verification:
Ensure the proof was generated using the correct attestation ID corresponding to the document type intended for the Airdrop.

Nullifier Registration and Verification:
Prevent double claims by registering and verifying a nullifier. Although the nullifier does not reveal any document details, it is uniquely tied to the document. 

User Identifier Registration:
Verify that the proof includes a valid user identifier (in this case, the address that will receive the Airdrop).

Proof Verification by IdentityVerificationHub:
Validate the proof itself using our IdentityVerificationHub, which also performs additional checks (e.g., olderThan, forbiddenCountries, and OFAC validations) as configured for the Airdrop.

State Variables for Nullifier and User Identifier
Within the Airdrop contract, mappings are declared to keep track of used nullifiers and registered user identifiers:

Copy
mapping(uint256 => uint256) internal _nullifiers;
mapping(uint256 => bool) internal _registeredUserIdentifiers;
Overriding the verifySelfProof Function
The verifySelfProof function is overridden as follows to include all necessary checks:

Copy
function verifySelfProof(
    IVcAndDiscloseCircuitVerifier.VcAndDiscloseProof memory proof
) 
    public 
    override 
{
    // Check that the registration period for the user identifier is open
    if (!isRegistrationOpen) {
        revert RegistrationNotOpen();
    }
        
    // Verify that the proof was generated using the correct scope
    if (_scope != proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_SCOPE_INDEX]) {
        revert InvalidScope();
    }

    // Verify that the proof was generated using the correct attestation ID
    if (_attestationId != proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_ATTESTATION_ID_INDEX]) {
        revert InvalidAttestationId();
    }

    // Ensure the nullifier has not already been used
    if (_nullifiers[proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_NULLIFIER_INDEX]] != 0) {
        revert RegisteredNullifier();
    }
        
    // Verify that the proof includes a valid user identifier (i.e., the receiving address for the Airdrop)
    if (proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_USER_IDENTIFIER_INDEX] == 0) {
        revert InvalidUserIdentifier();
    }

    // Validate the proof itself. This includes checks for olderThan, forbiddenCountries, and OFAC settings as specified by the Airdrop contract.
    IIdentityVerificationHubV1.VcAndDiscloseVerificationResult memory result = _identityVerificationHub.verifyVcAndDisclose(
        IIdentityVerificationHubV1.VcAndDiscloseHubProof({
            olderThanEnabled: _verificationConfig.olderThanEnabled,
            olderThan: _verificationConfig.olderThan,
            forbiddenCountriesEnabled: _verificationConfig.forbiddenCountriesEnabled,
            forbiddenCountriesListPacked: _verificationConfig.forbiddenCountriesListPacked,
            ofacEnabled: _verificationConfig.ofacEnabled,
            vcAndDiscloseProof: proof
        })
    );

    // Register the nullifier and the user identifier (i.e., the receiving address for the Airdrop)
    _nullifiers[result.nullifier] = proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_USER_IDENTIFIER_INDEX];
    _registeredUserIdentifiers[proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_USER_IDENTIFIER_INDEX]] = true;

    // Emit an event to signal successful registration
    emit UserIdentifierRegistered(
        proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_USER_IDENTIFIER_INDEX],
        result.nullifier
    );
}
Configuring Verification Parameters
To allow modifications to the verification parameters—such as olderThan, forbiddenCountries, and ofac settings—the Airdrop contract imports the following file:

Copy
import {ISelfVerificationRoot} from "../interfaces/ISelfVerificationRoot.sol";
It then adds a function to update the verification configuration:

Copy
function setVerificationConfig(
    ISelfVerificationRoot.VerificationConfig memory newVerificationConfig
) external onlyOwner {
    _verificationConfig = newVerificationConfig;
}
By following this example, you can see how our smart contract is integrated into an Airdrop scenario, ensuring that all necessary verifications are performed and that users receive Airdrops only under valid conditions.

Happy Birthday Example
In the Airdrop example, we showed how to customize verification parameters when integrating Self. In this example, we will demonstrate how to use the attributes contained in a passport to build the "happy-birthday" app.

Breakdown of the repo:

calling the contracts

The happy-birthday application checks the user's birthday recorded in their passport and, if the birthday is within ±5 days of the current block timestamp, awards the user with USDC.

Importing Required Files
Just like in the Airdrop example, start by importing the following files:

Copy
import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {IVcAndDiscloseCircuitVerifier} from "@selfxyz/contracts/contracts/interfaces/IVcAndDiscloseCircuitVerifier.sol";
import {IIdentityVerificationHubV1} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV1.sol";
import {CircuitConstants} from "@selfxyz/contracts/contracts/constants/CircuitConstants.sol";
Since the passport attributes are packed into the proof as revealedData_packed, import these libraries to extract and handle the data:

Copy
import {Formatter} from "@selfxyz/contracts/contracts/libraries/Formatter.sol";
import {CircuitAttributeHandler} from "@selfxyz/contracts/contracts/libraries/CircuitAttributeHandler.sol";
Verifications in happy-birthday
The happy-birthday app performs the following verifications:

Scope Check:
Confirm that the proof was generated specifically for this app.

Attestation ID Check:
Ensure the proof was created using the correct attestation ID for the document used by the app.

Nullifier Registration and Check:
Prevent multiple claims by registering and verifying the nullifier. The nullifier is a unique value that corresponds one-to-one with the document without revealing any details.

Proof Verification via IdentityVerificationHub:
Validate the proof itself, including additional verifications (e.g., olderThan, forbiddenCountries, and OFAC) as set by the contract.

Birthday Verification:
Verify that the user's date of birth (extracted from the proof) is within ±5 days of the current block.timestamp.

Overriding the verifySelfProof Function
Below is an example implementation of verifySelfProof for the happy-birthday app:

Copy
function verifySelfProof(
    IVcAndDiscloseCircuitVerifier.VcAndDiscloseProof memory proof
)
    public
    override
{
    // Verify that the correct scope was used to generate the proof.
    if (_scope != proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_SCOPE_INDEX]) {
        revert InvalidScope();
    }

    // Verify that the correct attestation ID was used to generate the proof.
    if (_attestationId != proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_ATTESTATION_ID_INDEX]) {
        revert InvalidAttestationId();
    }

    // Ensure the nullifier has not already been used.
    if (_nullifiers[proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_NULLIFIER_INDEX]]) {
        revert RegisteredNullifier();
    }

    // Validate the proof itself.
    // This includes additional checks set for the happy-birthday app (e.g., olderThan, forbiddenCountries, and OFAC validations).
    IIdentityVerificationHubV1.VcAndDiscloseVerificationResult memory result = _identityVerificationHub.verifyVcAndDisclose(
        IIdentityVerificationHubV1.VcAndDiscloseHubProof({
            olderThanEnabled: _verificationConfig.olderThanEnabled,
            olderThan: _verificationConfig.olderThan,
            forbiddenCountriesEnabled: _verificationConfig.forbiddenCountriesEnabled,
            forbiddenCountriesListPacked: _verificationConfig.forbiddenCountriesListPacked,
            ofacEnabled: _verificationConfig.ofacEnabled,
            vcAndDiscloseProof: proof
        })
    );

    // Perform the birthday verification.
    if (_isWithinBirthdayWindow(result.revealedDataPacked)) {
        // Register the nullifier and transfer USDC to the user.
        _nullifiers[result.nullifier] = true;
        usdc.safeTransfer(address(uint160(result.userIdentifier)), CLAIMABLE_AMOUNT);
        emit USDCClaimed(address(uint160(result.userIdentifier)), CLAIMABLE_AMOUNT);
    } else {
        revert("Not eligible: Not within 5 days of birthday");
    }
}
Extracting and Comparing the Date of Birth
The birthday information is packed into revealedData_packed in the proof. To verify the birthday, follow these steps:

Convert the Packed Data:
Convert revealedData_packed into a single bytes array using the Formatter.fieldElementsToBytes function.

Extract the Date of Birth:
Use the CircuitAttributeHandler.getDateOfBirth function to extract the date of birth from the byte array.

Reformat the Date:
The extracted date is in the format DD-MM-YY, but the Formatter.dateToUnixTimestamp function expects a YYMMDD string. Rearrange the data accordingly.
(In this example, the year is hard-coded as "25" to represent the birthday in 2025 at midnight.)

Compare with the Current Time:
Convert the reformatted date to a timestamp and compare it with the current block.timestamp to check if the difference is within ±5 days.

Below is the helper function _isWithinBirthdayWindow that implements this logic:

Copy
function _isWithinBirthdayWindow(
    // Accepts the revealedData_packed from the proof.
    uint256[3] memory revealedDataPacked
) 
    internal 
    view 
    returns (bool) 
{
    // Convert the field elements into a single bytes array.
    bytes memory charcodes = Formatter.fieldElementsToBytes(revealedDataPacked);
    
    // Extract the date of birth using CircuitAttributeHandler.
    string memory dob = CircuitAttributeHandler.getDateOfBirth(charcodes);

    // The Formatter.dateToUnixTimestamp function converts a string in YYMMDD format
    // (representing midnight of that day) into a Unix timestamp.
    // Since dob is in the 'DD-MM-YY' format, we need to rearrange it.
    bytes memory dobBytes = bytes(dob);
    bytes memory dayBytes = new bytes(2);
    bytes memory monthBytes = new bytes(2);

    dayBytes[0] = dobBytes[0];
    dayBytes[1] = dobBytes[1];

    monthBytes[0] = dobBytes[3];
    monthBytes[1] = dobBytes[4];

    string memory day = string(dayBytes);
    string memory month = string(monthBytes);
    // Concatenate to form the date string for the current year (e.g., "25" for 2025).
    string memory dobInThisYear = string(abi.encodePacked("25", month, day));
    uint256 dobInThisYearTimestamp = Formatter.dateToUnixTimestamp(dobInThisYear);

    // Get the current block.timestamp and compute the absolute time difference.
    uint256 currentTime = block.timestamp;
    uint256 timeDifference = currentTime > dobInThisYearTimestamp
        ? currentTime - dobInThisYearTimestamp
        : dobInThisYearTimestamp - currentTime;
    
    // Check if the difference is within ± 5 days.
    uint256 fiveDaysInSeconds = 5 days;
    return timeDifference <= fiveDaysInSeconds;
}
In summary, the birthday comparison requires some data transformation after extracting the date of birth from revealedData_packed. If you only need to retrieve an attribute, the combination of Formatter.fieldElementsToBytes and the appropriate function from CircuitAttributeHandler will suffice.

This example demonstrates how to leverage passport attributes—specifically the date of birth—to implement custom logic in your smart contract integration. Adjust the implementation as needed for your application's requirements.

Utilize Passport Attributes
In the happy-birthday example, we demonstrated one way to utilize the passport information when integrating Self. Note that the passport details—and the forbiddenCountries data—are bundled into the circuit's public signals in order to reduce onchain data. This bundled format is not very user-friendly for reading.

If you simply need the data in a readable format, you can call the following functions from the IdentityVerificationHub.

Readable Data Extraction
Get Readable Passport Data
You can retrieve readable attributes by calling:

Copy
function getReadableRevealedData(
    uint256[3] memory revealedDataPacked,
    RevealedDataType[] memory types
)
    external
    virtual
    onlyProxy
    view
    returns (ReadableRevealedData memory)
{
    bytes memory charcodes = Formatter.fieldElementsToBytes(
        revealedDataPacked
    );

    ReadableRevealedData memory attrs;

    for (uint256 i = 0; i < types.length; i++) {
        RevealedDataType dataType = types[i];
        if (dataType == RevealedDataType.ISSUING_STATE) {
            attrs.issuingState = CircuitAttributeHandler.getIssuingState(charcodes);
        } else if (dataType == RevealedDataType.NAME) {
            attrs.name = CircuitAttributeHandler.getName(charcodes);
        } else if (dataType == RevealedDataType.PASSPORT_NUMBER) {
            attrs.passportNumber = CircuitAttributeHandler.getPassportNumber(charcodes);
        } else if (dataType == RevealedDataType.NATIONALITY) {
            attrs.nationality = CircuitAttributeHandler.getNationality(charcodes);
        } else if (dataType == RevealedDataType.DATE_OF_BIRTH) {
            attrs.dateOfBirth = CircuitAttributeHandler.getDateOfBirth(charcodes);
        } else if (dataType == RevealedDataType.GENDER) {
            attrs.gender = CircuitAttributeHandler.getGender(charcodes);
        } else if (dataType == RevealedDataType.EXPIRY_DATE) {
            attrs.expiryDate = CircuitAttributeHandler.getExpiryDate(charcodes);
        } else if (dataType == RevealedDataType.OLDER_THAN) {
            attrs.olderThan = CircuitAttributeHandler.getOlderThan(charcodes);
        } else if (dataType == RevealedDataType.PASSPORT_NO_OFAC) {
            attrs.passportNoOfac = CircuitAttributeHandler.getPassportNoOfac(charcodes);
        } else if (dataType == RevealedDataType.NAME_AND_DOB_OFAC) {
            attrs.nameAndDobOfac = CircuitAttributeHandler.getNameAndDobOfac(charcodes);
        } else if (dataType == RevealedDataType.NAME_AND_YOB_OFAC) {
            attrs.nameAndYobOfac = CircuitAttributeHandler.getNameAndYobOfac(charcodes);
        }
    }

    return attrs;
}
Get Readable Forbidden Countries
Similarly, to extract the forbiddenCountries list in a readable format:

Copy

function getReadableForbiddenCountries(
    uint256[4] memory forbiddenCountriesListPacked
)
    external
    virtual
    onlyProxy
    view
    returns (string[MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH] memory)
{
    return Formatter.extractForbiddenCountriesFromPacked(forbiddenCountriesListPacked);
}
In the getReadableRevealedData function, you specify the types of data you want to expose to reduce unnecessary processing and save gas. Please use the following enum defined in the IIdentityVerificationHub:

Copy
enum RevealedDataType {
    ISSUING_STATE,     // The issuing state of the passport.
    NAME,              // The full name of the passport holder.
    PASSPORT_NUMBER,   // The passport number.
    NATIONALITY,       // The nationality.
    DATE_OF_BIRTH,     // The date of birth.
    GENDER,            // The gender.
    EXPIRY_DATE,       // The passport expiry date.
    OLDER_THAN,        // The "older than" age verification value.
    PASSPORT_NO_OFAC,  // The passport number OFAC status.
    NAME_AND_DOB_OFAC, // The name and date of birth OFAC status.
    NAME_AND_YOB_OFAC  // The name and year of birth OFAC status.
}
Additional Libraries for Enhanced Flexibility
Self provides several convenient functions as libraries so that external contracts can easily use our features. The two main libraries included in @selfxyz/contracts are Formatter and CircuitAttributeHandler. Below is a summary of their key functions:

Formatter
| Function | Description |
|----------|-------------|
| formatName | Converts raw name data from the passport into a human-readable format. |
| formatDate | Transforms date data from the YYMMDD format into the DD-MM-YY format. |
| numAsciiToUint | Converts numerical data represented as ASCII characters into a uint. |
| fieldElementToBytes | Converts the three bn254 field elements of revealedDataPacked into a single bytes array. |
| extractForbiddenCountriesFromPacked | Transforms the four bn254 field elements of forbiddenCountriesListPacked into a readable array of three-letter country codes. |
| proofDateToUnixTimestamp | Converts the six proof-generated date signals into the Unix timestamp for midnight of that day. |
| dateToUnixTimestamp | Converts a date string in YYMMDD format into the Unix timestamp for midnight of that day. |
| substring | Used to extract a substring from a given string. |
| parseDatePart | Converts a date component represented as a string into a numeric value. |
| toTimestamp | Accepts numeric year, month, and day values and returns the Unix timestamp for midnight of that day. |
| isLeapYear | Checks whether a given year is a leap year when converting to a timestamp. |

CircuitAttributeHandler
| Function | Description |
|----------|-------------|
| getIssuingState | Extracts the issuing state information from the bytes array produced by fieldElementToBytes. |
| getName | Extracts the name from the bytes data. |
| getPassportNumber | Extracts the passport number from the bytes data. |
| getNationality | Extracts the nationality from the bytes data. |
| getDateOfBirth | Extracts the date of birth from the bytes data. |
| getGender | Extracts the gender from the bytes data. |
| getExpiryDate | Extracts the expiry date from the bytes data. |
| getOlderThan | Extracts the age verification ("older than") value from the bytes data. |
| getPassportNoOfac | Extracts the OFAC check result for the passport number from the bytes data. |
| getNameAndDobOfac | Extracts the OFAC check result for the name and date of birth from the bytes data. |
| getNameAndYobOfac | Extracts the OFAC check result for the name and year of birth from the bytes data. |
| compareOfac | Verifies that the OFAC check passes without issues. |
| compareOlderThan | Checks that the proof meets the required minimum age. |
| extractStringAttributes | Extracts string attributes from specific positions within the bytes data. |

Use these functions in your contracts as needed to enhance the usability of the passport data and to interact flexibly with Self's verification functionality.

Overview
An in-depth overview of the Self protocol.

Introduction
The Self protocol is an identity protocol designed to let people use their real-world attestation in a permissionless way, for Sybil resistance and selective disclosure. Our core thesis is that web-of-trust systems are hard to scale securely, and biometric verification à la Worldcoin has a long way to go, so bootstrapping from existing sources of trust like institutions is the most pragmatic way to verify identities securely today and in a privacy preserving way. We're starting with passports, and national IDs.

Self has three main components:

A mobile app that lets users easily scan the NFC chip in their passport. The mobile app operates both on iOS and Android, and performs the authentication mechanisms required by the passport to read the content of its chip (BAC/PACE).

Zero-knowledge circuits that can be used to verify the validity of certificates and passports, generate identity commitments and selectively disclose attributes.

Smart contracts that verify proofs, manage a merkle tree of identity commitments and allow for onchain disclosure of data while guaranteeing the permissionless aspect of the protocol.

Background on Biometric Passports
Biometric passports were introduced in the 2000s as a way to streamline border control and reduce the risk of passport forgery. They are now issued in more than 170 countries, and their specifications are established by the ICAO (International Civil Aviation Organisation) and made available in Document 9303 on their website.

Each biometric passport contains an embedded microchip that can be read by any NFC reader. It stores multiple datagroups (up to 16) along with a SOD (Document Security Object) that can be used to verify the integrity of the passport. The SOD contains hashes of all datagroups, a signature attesting to the validity of the passport, information on which hash functions and signature algorithms were used, and the certificate that signed the passport.

All possible datagroups and their content can be found in the image below. DG1 and DG2 are mandatory, the rest is optional.


In particular:

DG1 has the same content as the machine readable zone, and is the source of all the information we care to verify.


DG2 contains the person's photo. Because it contains a lot of entropy, it makes sure that the final signature can't be dictionary-attacked starting with some of the person's information.

DG15 (optional) is the public key corresponding to the passport's Active Authentication private key. We plan to use it to improve security in the future.


The passport data groups are hashed and process, and the resulting final hash is signed by a Document Signing Certificate (DSC), which is itself signed by a Country Signing Certificate Authority (CSCA) as part of a certificate chain. The DSC can be read from the passport's chip and the CSCA can be looked up on international registries such as the ICAO masterlist.

The eContent consists of the concatenation of all DG hashes, while the signedAttr is the final message signed by the issuing country. Sometimes, different hashing algorithms are used at each step.

According to the specifications, each DSC should sign up to 100k passports, each CSCA should rotate every 3-5 years, and a country should always have at minimum 2 valid CSCA at the same time.