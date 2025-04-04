# Self Protocol - Practical Insights

This document compiles key insights about Self Protocol gathered from developer discussions that complement the official documentation.

## Mock Passport Creation
When NFC passport scanning is not available:
- On the first screen, tap 5 times with 2 fingers on the card
- A screen to create a mock passport will appear
- Choose "sha1 rsa 2048" from the signature algorithm list
- Continue with the standard flow

## Testing Environment
- Staging playground available at: https://playground.staging.self.xyz/
- The Self team has deployed on the testnet for testing purposes
- For local development, you must use ngrok or similar to expose your localhost endpoint

## Blockchain Integration
- Currently deployed primarily on Celo blockchain
- For on-chain SDK usage, Celo is the recommended chain
- Polygon integration may be available in the future
- To verify in other chains, you can use the backend node-js SDK and then send a tx on your chain of choice

## Troubleshooting
Common errors and solutions:
- "INVALID_COMMITMENT_ROOT" error - Check mockPassport configuration in backend
- Error during verification: Enable mockPassport in backend verifier with `mockPassport: true`
- "Error calling verifySetProof function" - May be related to gas estimation issues
- Restart ngrok if experiencing caching issues
- Add `devmode: true` to frontend configuration when testing

## Current SDK Versions
```json
"@selfxyz/core": "^0.0.21",
"@selfxyz/qrcode": "^0.0.17"
```

## Data Disclosure Limitations
- Eye color and hair color are not accessible through the Self protocol
- For supported disclosure attributes, see: https://docs.self.xyz/sdk-reference/selfappbuilder#disclosure-options

## Browser Compatibility Issues
- Brave browser may block WebSocket connections needed by the Self protocol
- If getting WebSocket timeouts, try using a different browser

## Additional Configuration Options
For development and testing:
```javascript
// Backend
const selfBackendVerifier = new SelfBackendVerifier(
    "https://forno.celo.org", // Celo RPC url
    "my-app-scope",
    "https://myapp.com/api/verify", // Must be publicly accessible
    true // mockPassport: true for testing
);

// Frontend
const selfApp = new SelfAppBuilder({
    appName: "My App",
    scope: "my-app-scope", 
    endpoint: "https://myapp.com/api/verify",
    endpointType: "https",
    logoBase64: "<base64EncodedLogo>",
    userId,
    devmode: true // For testing with mock passports
}).build();
``` 