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
  currentRoom?: string;
  generalRoom?: Phaser.GameObjects.Rectangle;
  adultRoom?: Phaser.GameObjects.Rectangle;
  generalObjects?: Phaser.GameObjects.Components.Visible[];
  adultObjects?: Phaser.GameObjects.Components.Visible[];
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
            this.load.image("background", "/assets/grass.png");
            this.load.image("player", "/assets/player.png");
            // Load map tiles and objects
            this.load.image("grass", "/assets/grass.png");
            this.load.image("wall", "/assets/placeholder.html");
            this.load.image("door", "/assets/placeholder.html");
          }

          create() {
            const scene = this as GameScene;
            scene.address = address;
            scene.isAdult = isAdult;
            scene.otherPlayers = new Map();
            scene.currentRoom = "general";
            scene.generalObjects = [];
            scene.adultObjects = [];

            // Create world container for each room
            const generalWorld = this.add.container(0, 0);
            const adultWorld = this.add.container(0, 0);

            // Initially hide adult world
            adultWorld.setVisible(false);

            // General room (visible by default)
            // We won't use a black rectangle as the background anymore

            // Add general room background and objects
            const generalBackground = this.add
              .image(400, 300, "grass")
              .setDisplaySize(800, 600);
            generalWorld.add(generalBackground);
            scene.generalObjects.push(generalBackground);

            // Add room label
            const generalRoomLabel = this.add
              .text(400, 50, "General Room", {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#FFFFFF",
                backgroundColor: "#000000",
                padding: { x: 5, y: 3 },
              })
              .setOrigin(0.5);
            generalWorld.add(generalRoomLabel);
            scene.generalObjects.push(generalRoomLabel);

            // Add door to adult room
            const adultRoomDoor = this.add
              .rectangle(750, 300, 50, 100, 0xaa0000)
              .setInteractive();
            generalWorld.add(adultRoomDoor);
            scene.generalObjects.push(adultRoomDoor);

            const doorLabel = this.add
              .text(750, 280, "18+", {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#FFFFFF",
              })
              .setOrigin(0.5);
            generalWorld.add(doorLabel);
            scene.generalObjects.push(doorLabel);

            // Adult room
            // Add adult room background and objects
            const adultBackground = this.add
              .image(400, 300, "grass")
              .setDisplaySize(800, 600);
            // Add a red tint to adult room
            adultBackground.setTint(0xffaaaa);
            adultWorld.add(adultBackground);
            scene.adultObjects.push(adultBackground);

            // Add room label
            const adultRoomLabel = this.add
              .text(400, 50, "Adult Only (18+)", {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#FFFFFF",
                backgroundColor: "#000000",
                padding: { x: 5, y: 3 },
              })
              .setOrigin(0.5);
            adultWorld.add(adultRoomLabel);
            scene.adultObjects.push(adultRoomLabel);

            // Add door back to general room
            const backToDoor = this.add
              .rectangle(50, 300, 50, 100, 0x0000aa)
              .setInteractive();
            adultWorld.add(backToDoor);
            scene.adultObjects.push(backToDoor);

            const backText = this.add
              .text(50, 280, "Exit", {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#FFFFFF",
              })
              .setOrigin(0.5);
            adultWorld.add(backText);
            scene.adultObjects.push(backText);

            // Store world containers for reference
            scene.generalRoom = generalWorld as any;
            scene.adultRoom = adultWorld as any;

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

            // Door interactions
            adultRoomDoor.on("pointerup", () => {
              // Check if player can access adult room
              if (scene.isAdult !== true) {
                // Show a notification
                if (!this.registry.get("adultsOnlyMessageShown")) {
                  alert(
                    "Adults Only! You need to verify your age to enter this room."
                  );
                  this.registry.set("adultsOnlyMessageShown", true);
                }
                return;
              }

              // Switch to adult room
              this.switchRoom("adult");

              // If entering adult room, show token reward notification
              alert(
                "🎉 You earned 5 FRENG tokens for entering the adults-only lounge!"
              );
            });

            backToDoor.on("pointerup", () => {
              // Switch back to general room
              this.switchRoom("general");
            });
          }

          switchRoom(roomName: string) {
            const scene = this as GameScene;
            if (!scene.playerSprite || !scene.generalRoom || !scene.adultRoom)
              return;

            if (roomName === "adult" && scene.currentRoom !== "adult") {
              // Hide general room
              scene.generalRoom.setVisible(false);
              // Show adult room
              scene.adultRoom.setVisible(true);

              // Move player to adult room entrance
              scene.playerSprite.x = 100;
              scene.playerSprite.y = 300;

              // Update current room
              scene.currentRoom = "adult";
              setCurrentRoom("adults-only");
            } else if (
              roomName === "general" &&
              scene.currentRoom !== "general"
            ) {
              // Hide adult room
              scene.adultRoom.setVisible(false);
              // Show general room
              scene.generalRoom.setVisible(true);

              // Move player to general room entrance
              scene.playerSprite.x = 700;
              scene.playerSprite.y = 300;

              // Update current room
              scene.currentRoom = "general";
              setCurrentRoom("general");
            }
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

            // Add boundaries to keep player in the room
            if (scene.playerSprite.x < 50) scene.playerSprite.x = 50;
            if (scene.playerSprite.x > 750) scene.playerSprite.x = 750;
            if (scene.playerSprite.y < 50) scene.playerSprite.y = 50;
            if (scene.playerSprite.y > 550) scene.playerSprite.y = 550;
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
  }, [address, isAdult, gameInstance]);

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
