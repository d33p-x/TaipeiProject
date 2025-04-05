// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StringUtils} from "@ensdomains/ens-contracts/utils/StringUtils.sol";

import {IL2Registry} from "../interfaces/IL2Registry.sol";

/// @dev This is an example registrar contract that is mean to be modified.
contract L2Registrar {
    using StringUtils for string;

    /// @notice Emitted when a new name is registered
    /// @param label The registered label (e.g. "name" in "name.eth")
    /// @param owner The owner of the newly registered name
    event NameRegistered(string indexed label, address indexed owner);

    /// @notice Reference to the target registry contract
    IL2Registry public immutable registry;

    /// @notice The chainId for the current chain
    uint256 public chainId;

    /// @notice The coinType for the current chain (ENSIP-11)
    uint256 public immutable coinType;

    /// @notice Address authorized to sign verification messages
    address public verifier;

    /// @notice Mapping to track verified addresses
    mapping(address => bool) public verifiedAddresses;

    /// @notice Initializes the registrar with a registry contract
    /// @param _registry Address of the L2Registry contract
    /// @param _verifier Address of the verifier that signs verification messages
    constructor(address _registry, address _verifier) {
        // Save the chainId in memory (can only access this in assembly)
        assembly {
            sstore(chainId.slot, chainid())
        }

        // Calculate the coinType for the current chain according to ENSIP-11
        coinType = (0x80000000 | chainId) >> 0;

        // Save the registry address
        registry = IL2Registry(_registry);

        // Save the verifier address
        verifier = _verifier;
    }

    /// @notice Registers a new name with verification
    /// @param label The label to register (e.g. "name" for "name.eth")
    /// @param owner The address that will own the name
    /// @param timestamp Timestamp when verification was issued
    /// @param signature Signature from verifier confirming verification
    function register(
        string calldata label,
        address owner,
        uint256 timestamp,
        bytes memory signature
    ) external {
        require(msg.sender == owner, "Can only register for yourself");

        // Verify signature from verifier
        bytes32 messageHash = keccak256(
            abi.encodePacked(owner, "VERIFIED", timestamp)
        );
        require(
            recoverSigner(messageHash, signature) == verifier,
            "Invalid verification"
        );
        require(block.timestamp - timestamp < 1 hours, "Verification expired");

        // Mark address as verified
        verifiedAddresses[owner] = true;

        bytes32 node = _labelToNode(label);
        bytes memory addr = abi.encodePacked(owner); // Convert address to bytes

        // Set the forward address for the current chain. This is needed for reverse resolution.
        // E.g. if this contract is deployed to Base, set an address for chainId 8453 which is
        // coinType 2147492101 according to ENSIP-11.
        registry.setAddr(node, coinType, addr);

        // Set the forward address for mainnet ETH (coinType 60) for easier debugging.
        registry.setAddr(node, 60, addr);

        // Store verification status in text record
        registry.setText(node, "verification.status", "verified");
        registry.setText(
            node,
            "verification.timestamp",
            uint256ToString(timestamp)
        );

        // Register the name in the L2 registry
        registry.createSubnode(
            registry.baseNode(),
            label,
            owner,
            new bytes[](0)
        );
        emit NameRegistered(label, owner);
    }

    /// @notice Simple method to check if an address is already verified
    /// @param user The address to check
    /// @return isVerified True if the address is verified
    function isVerified(address user) external view returns (bool) {
        return verifiedAddresses[user];
    }

    /// @notice Checks if a given label is available for registration
    /// @dev Uses try-catch to handle the ERC721NonexistentToken error
    /// @param label The label to check availability for
    /// @return available True if the label can be registered, false if already taken
    function available(string calldata label) external view returns (bool) {
        bytes32 node = _labelToNode(label);
        uint256 tokenId = uint256(node);

        try registry.ownerOf(tokenId) {
            return false;
        } catch {
            if (label.strlen() >= 3) {
                return true;
            }
            return false;
        }
    }

    /// @notice Helper to convert uint256 to string
    /// @param value The uint256 to convert
    /// @return The string representation
    function uint256ToString(
        uint256 value
    ) internal pure returns (string memory) {
        // Handle zero case
        if (value == 0) {
            return "0";
        }

        // Find number of digits
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        // Allocate string
        bytes memory buffer = new bytes(digits);

        // Fill string from right to left
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    /// @notice Recover the signer of a message from the signature
    /// @param messageHash The hash of the message
    /// @param signature The signature bytes
    /// @return The address of the signer
    function recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature 'v' value");

        // EIP-712 compliant - hash the messageHash again for recovery
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function _labelToNode(
        string calldata label
    ) private view returns (bytes32) {
        return registry.makeNode(registry.baseNode(), label);
    }
}
