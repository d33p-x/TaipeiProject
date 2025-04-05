"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useAgeVerification } from "@/providers/AgeVerificationProvider";

// Define game types
type GameScene = Phaser.Scene & {
  playerSprite?: Phaser.GameObjects.Sprite;
  playerLabel?: Phaser.GameObjects.Text;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  otherPlayers?: Map<
    string,
    { sprite: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text }
  >;
  socket?: any;
  address?: string;
  isAdult?: boolean | null;
};

export default function GameWorld() {
  const gameRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const { isAdult } = useAgeVerification();
  const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string>("general");

  useEffect(() => {
    if (!gameRef.current || !address) return;

    // Only load Phaser when we're in the browser
    const loadPhaser = async () => {
      if (typeof window !== "undefined") {
        const Phaser = (await import("phaser")).default;

        class MainScene extends Phaser.Scene {
          constructor() {
            super({ key: "MainScene" });
          }

          preload() {
            // Load assets
            this.load.image("background", "/assets/background.png");
            this.load.image("player", "/assets/player.png");
          }

          create() {
            const scene = this as GameScene;
            scene.address = address;
            scene.isAdult = isAdult;
            scene.otherPlayers = new Map();

            // Add background
            this.add
              .image(0, 0, "background")
              .setOrigin(0, 0)
              .setDisplaySize(800, 600);

            // Add player
            scene.playerSprite = this.add.sprite(400, 300, "player");

            // Add player label (wallet address)
            scene.playerLabel = this.add
              .text(
                400,
                270,
                address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Player",
                {
                  fontFamily: "Arial",
                  fontSize: "12px",
                  color: "#FFFFFF",
                  backgroundColor: "#000000",
                  padding: { x: 3, y: 2 },
                }
              )
              .setOrigin(0.5, 1);

            // Setup keyboard input
            scene.cursors = this.input.keyboard?.createCursorKeys();

            // Set camera to follow player
            if (scene.playerSprite) {
              this.cameras.main.startFollow(scene.playerSprite, true, 0.5, 0.5);
            }

            // Define room boundaries
            const generalRoomBounds = new Phaser.Geom.Rectangle(0, 0, 400, 600);
            const adultRoomBounds = new Phaser.Geom.Rectangle(400, 0, 400, 600);

            // Add room labels
            this.add
              .text(200, 50, "General Room", {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#FFFFFF",
              })
              .setOrigin(0.5);

            this.add
              .text(600, 50, "Adult Only (18+)", {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#FFFFFF",
              })
              .setOrigin(0.5);

            // Add divider between rooms
            this.add.line(400, 300, 0, 0, 0, 600, 0xffffff).setLineWidth(4);
          }

          update() {
            const scene = this as GameScene;
            if (!scene.playerSprite || !scene.cursors || !scene.playerLabel)
              return;

            // Handle player movement
            const speed = 3;
            let moved = false;

            if (scene.cursors.left.isDown) {
              scene.playerSprite.x -= speed;
              moved = true;
            } else if (scene.cursors.right.isDown) {
              scene.playerSprite.x += speed;
              moved = true;
            }

            if (scene.cursors.up.isDown) {
              scene.playerSprite.y -= speed;
              moved = true;
            } else if (scene.cursors.down.isDown) {
              scene.playerSprite.y += speed;
              moved = true;
            }

            // Update label position to follow sprite
            scene.playerLabel.x = scene.playerSprite.x;
            scene.playerLabel.y = scene.playerSprite.y - 30;

            // Restrict access to adult room based on verification
            if (scene.playerSprite.x > 400 && scene.isAdult !== true) {
              scene.playerSprite.x = 400;
              // Show a notification
              if (!this.registry.get("adultsOnlyMessageShown")) {
                alert(
                  "Adults Only! You need to verify your age to enter this room."
                );
                this.registry.set("adultsOnlyMessageShown", true);
              }
            }

            // Update current room
            if (moved) {
              const newRoom =
                scene.playerSprite.x <= 400 ? "general" : "adults-only";
              if (newRoom !== currentRoom) {
                setCurrentRoom(newRoom);

                // If entering adult room, show token reward notification
                if (newRoom === "adults-only") {
                  alert(
                    "🎉 You earned 5 FRENG tokens for entering the adults-only lounge!"
                  );
                }
              }
            }
          }
        }

        // Initialize the game if it doesn't exist
        if (!gameInstance) {
          const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current,
            scene: [MainScene],
            physics: {
              default: "arcade",
              arcade: {
                gravity: { x: 0, y: 0 },
                debug: false,
              },
            },
          };

          const game = new Phaser.Game(config);
          setGameInstance(game);

          return () => {
            game.destroy(true);
          };
        }
      }
    };

    loadPhaser();
  }, [address, isAdult, currentRoom, gameInstance]);

  if (!address) {
    return <div>Please connect your wallet to play</div>;
  }

  return (
    <div className="relative">
      <div ref={gameRef} className="rounded-lg overflow-hidden shadow-lg" />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
        Room: {currentRoom === "general" ? "General Chat" : "Adults Only (18+)"}
      </div>
    </div>
  );
}
