import { useState, useEffect, useRef } from "react";
import { useAccount } from "react-ethers";

export default function EnsDebug({ onNameFound }: { onNameFound?: (name: string) => void }) {
  const { address } = useAccount();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Set the name directly
  const setNameDirectly = (name: string) => {
    setEnsName(name);
    addLog("Directly set name to: " + name);
    // Call the callback when name is set directly
    if (onNameFound) onNameFound(name);
  };
  
  // Add a useEffect to notify parent when name changes
  useEffect(() => {
    if (ensName && onNameFound) {
      onNameFound(ensName);
    }
  }, [ensName, onNameFound]);
  
  // Modify query functions to call callback when name is found
  const queryByKnownNodeHash = async () => {
    // ... existing code ...
    
    try {
      // ... existing code ...
      
      if (encodedName && encodedName.length > 0) {
        // ... existing code ...
        
        if (decodedName) {
          const parts = decodedName.split(".");
          if (parts.length > 0) {
            const subdomainPart = parts[0];
            addLog("FOUND YOUR NAME: " + subdomainPart);
            setEnsName(subdomainPart);
            // Call the callback when name is found
            if (onNameFound) onNameFound(subdomainPart);
          }
        }
      }
      // ... existing code ...
    }
  };
  
  // Same for tryOtherNodeHash
  const tryOtherNodeHash = async () => {
    // ... existing code ...
    
    try {
      // ... existing code ...
      
      if (encodedName && encodedName.length > 0) {
        // ... existing code ...
        
        if (decodedName) {
          const parts = decodedName.split(".");
          if (parts.length > 0) {
            const subdomainPart = parts[0];
            addLog("FOUND YOUR NAME: " + subdomainPart);
            setEnsName(subdomainPart);
            // Call the callback when name is found
            if (onNameFound) onNameFound(subdomainPart);
          }
        }
      }
      // ... existing code ...
    }
  };
  
  // Add method to update player label
  scene.updatePlayerLabel = (newEnsName: string | null) => {
    if (!scene.playerLabel) return;

    console.log("Updating player label to:", newEnsName);

    // Update the scene's ensName property
    scene.ensName = newEnsName || undefined;

    // Update the label text
    scene.playerLabel.setText(
      newEnsName
        ? newEnsName
        : address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Player"
    );

    // Make sure the label is visible and properly displayed
    scene.playerLabel.setVisible(true);
    scene.playerLabel.setDepth(100); // Ensure label renders above other elements

    // Force a redraw of the text
    scene.playerLabel.updateText();

    // Ensure the label follows the player sprite (positioning update)
    if (scene.playerSprite) {
      scene.playerLabel.x = scene.playerSprite.x;
      scene.playerLabel.y = scene.playerSprite.y + 45; // Position below player
      
      // Add player label to the active container/world
      if (scene.currentRoom === "general" && scene.generalRoom) {
        scene.generalRoom.add(scene.playerLabel);
      } else if (scene.currentRoom === "adult" && scene.adultRoom) {
        scene.adultRoom.add(scene.playerLabel);
      } else if (scene.currentRoom === "kids" && scene.kidsRoom) {
        scene.kidsRoom.add(scene.playerLabel);
      }
    }
  };

  // Immediately resolve ENS name when component mounts or address changes
  useEffect(() => {
    if (address) {
      console.log("Initial ENS resolution for address:", address);
      resolveEnsName().then(name => {
        if (name) {
          console.log("Successfully resolved ENS name on mount:", name);
          
          // If game is already initialized, update the player label
          if (gameInstanceRef.current) {
            const scene = gameInstanceRef.current.scene.getScene("MainScene") as GameScene;
            if (scene && scene.updatePlayerLabel) {
              // Try immediate update
              scene.updatePlayerLabel(name);
              
              // Also try with a delay to ensure it happens after scene setup
              setTimeout(() => {
                if (scene && scene.updatePlayerLabel) {
                  scene.updatePlayerLabel(name);
                }
              }, 500);
            }
          }
        }
      });
    }
  }, [address]);

  // Update player label position to follow sprite
  if (scene.playerLabel && scene.playerSprite) {
    scene.playerLabel.x = scene.playerSprite.x;
    scene.playerLabel.y = scene.playerSprite.y + 45; // Position below player
    
    // Ensure the label is visible and on top
    scene.playerLabel.setVisible(true);
    scene.playerLabel.setDepth(100);

    // Make sure the label displays the ENS name if available
    if (scene.ensName && scene.playerLabel.text !== scene.ensName) {
      scene.playerLabel.setText(scene.ensName);
      scene.playerLabel.updateText();
      console.log("Updated label text to ENS name in update:", scene.ensName);
    }
  }

  // Add player label (wallet address or ENS name) - BELOW the avatar
  scene.playerLabel = this.add
    .text(
      width / 2,
      height / 2 + 45, // Move further down from 30 to 45
      ensName
        ? ensName
        : address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Player",
      {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#FFFFFF",
        padding: { x: 3, y: 2 },
        stroke: "#000000",
        strokeThickness: 3,
      }
    )
    .setOrigin(0.5, 0)
    .setDepth(100); // Ensure label is on top of other game elements

  // Store the ENS name as a property on the scene if available
  if (ensName) {
    scene.ensName = ensName;
    console.log("Set initial ENS name on scene creation:", ensName);
  }
} 