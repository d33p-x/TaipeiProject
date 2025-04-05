"use client";

import { useEffect, useRef } from "react";

interface TestPlayerProps {
  gameInstance: any;
}

export default function TestPlayer({ gameInstance }: TestPlayerProps) {
  const testPlayerRef = useRef<any>(null);

  useEffect(() => {
    if (!gameInstance) return;

    // Get the main scene
    const scene = gameInstance.scene.getScene("MainScene");
    if (!scene) return;

    // Add a test player at a fixed position
    const testPlayer = scene.add.sprite(400, 300, "playerMale");
    testPlayer.setDepth(100);
    testPlayer.setScale(1.2);
    testPlayer.setTint(0xff0000); // Red tint for visibility

    // Add label
    const label = scene.add
      .text(400, 340, "TEST PLAYER", {
        fontFamily: "Pixelify Sans",
        fontSize: "14px",
        color: "#FFFFFF",
        padding: { x: 3, y: 2 },
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    label.setDepth(100);

    // Save references
    testPlayerRef.current = { sprite: testPlayer, label };

    // Cleanup
    return () => {
      if (testPlayerRef.current) {
        testPlayerRef.current.sprite.destroy();
        testPlayerRef.current.label.destroy();
      }
    };
  }, [gameInstance]);

  return null; // This is a non-visual component
}
