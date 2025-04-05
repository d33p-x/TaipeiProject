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
  generalRoom?: Phaser.GameObjects.Container;
  adultRoom?: Phaser.GameObjects.Container;
  generalObjects?: Phaser.GameObjects.Components.Visible[];
  adultObjects?: Phaser.GameObjects.Components.Visible[];
  doorZone?: Phaser.GameObjects.Zone;
  exitZone?: Phaser.GameObjects.Zone;
  nearDoor?: boolean;
  nearExit?: boolean;
};

export default function GameWorld() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const { address } = useAccount();
  const { isAdult } = useAgeVerification();
  const [currentRoom, setCurrentRoom] = useState<string>("general");

  useEffect(() => {
    // Clear the container before creating a new game instance to prevent doubling
    if (gameRef.current) {
      gameRef.current.innerHTML = "";
    }

    if (!gameRef.current || !address) return;

    // Cleanup previous game instance if exists
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true);
      gameInstanceRef.current = null;
    }

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
            scene.nearDoor = false;
            scene.nearExit = false;

            // Set up camera
            this.cameras.main.setBackgroundColor("#000000");

            // Get the actual game dimensions for responsive sizing
            const width = this.sys.game.canvas.width;
            const height = this.sys.game.canvas.height;
            this.cameras.main.setBounds(0, 0, width, height);

            // Create world container for each room
            const generalWorld = this.add.container(0, 0);
            const adultWorld = this.add.container(0, 0);

            // Initially hide adult world
            adultWorld.setVisible(false);

            // General room (visible by default)
            // Add general room background
            const generalBackground = this.add
              .image(width / 2, height / 2, "grass")
              .setDisplaySize(width, height);
            generalWorld.add(generalBackground);
            scene.generalObjects.push(generalBackground);

            // Add room label (only one)
            const generalRoomLabel = this.add
              .text(width / 2, 80, "General Room", {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#FFFFFF",
                backgroundColor: "#000000",
                padding: { x: 5, y: 3 },
              })
              .setOrigin(0.5);
            generalWorld.add(generalRoomLabel);
            scene.generalObjects.push(generalRoomLabel);

            // Add door to adult room visual (no longer interactive)
            const adultRoomDoor = this.add.rectangle(
              width - 70,
              height / 2,
              70,
              140,
              0xaa0000
            );
            generalWorld.add(adultRoomDoor);
            scene.generalObjects.push(adultRoomDoor);

            // Add invisible door zone that will detect player proximity
            scene.doorZone = this.add.zone(width - 100, height / 2, 150, 200);
            scene.doorZone.setOrigin(0.5);

            // Add visual instructions
            const doorInstructions = this.add
              .text(width - 70, height / 2 + 70, "Walk here to enter", {
                fontFamily: "Arial",
                fontSize: "14px",
                color: "#FFFFFF",
                backgroundColor: "#000000",
                padding: { x: 3, y: 2 },
              })
              .setOrigin(0.5);
            generalWorld.add(doorInstructions);
            scene.generalObjects.push(doorInstructions);

            const doorLabel = this.add
              .text(width - 70, height / 2 - 20, "18+", {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#FFFFFF",
                fontStyle: "bold",
              })
              .setOrigin(0.5);
            generalWorld.add(doorLabel);
            scene.generalObjects.push(doorLabel);

            // Adult room
            // Add adult room background and objects
            const adultBackground = this.add
              .image(width / 2, height / 2, "grass")
              .setDisplaySize(width, height);
            // Add a red tint to adult room
            adultBackground.setTint(0xffaaaa);
            adultWorld.add(adultBackground);
            scene.adultObjects.push(adultBackground);

            // Add room label
            const adultRoomLabel = this.add
              .text(width / 2, 80, "Adult Only (18+)", {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#FFFFFF",
                backgroundColor: "#000000",
                padding: { x: 5, y: 3 },
              })
              .setOrigin(0.5);
            adultWorld.add(adultRoomLabel);
            scene.adultObjects.push(adultRoomLabel);

            // Add door back to general room visual (no longer interactive)
            const backToDoor = this.add.rectangle(
              70,
              height / 2,
              70,
              140,
              0x0000aa
            );
            adultWorld.add(backToDoor);
            scene.adultObjects.push(backToDoor);

            // Add invisible exit zone that will detect player proximity
            scene.exitZone = this.add.zone(100, height / 2, 150, 200);
            scene.exitZone.setOrigin(0.5);

            // Add visual instructions
            const exitInstructions = this.add
              .text(70, height / 2 + 70, "Walk here to exit", {
                fontFamily: "Arial",
                fontSize: "14px",
                color: "#FFFFFF",
                backgroundColor: "#000000",
                padding: { x: 3, y: 2 },
              })
              .setOrigin(0.5);
            adultWorld.add(exitInstructions);
            scene.adultObjects.push(exitInstructions);

            const backText = this.add
              .text(70, height / 2 - 20, "Exit", {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#FFFFFF",
                fontStyle: "bold",
              })
              .setOrigin(0.5);
            adultWorld.add(backText);
            scene.adultObjects.push(backText);

            // Store world containers for reference
            scene.generalRoom = generalWorld;
            scene.adultRoom = adultWorld;

            // Add player
            scene.playerSprite = this.add.sprite(
              width / 2,
              height / 2,
              "player"
            );

            // Add player label (wallet address) - BELOW the avatar
            scene.playerLabel = this.add
              .text(
                width / 2,
                height / 2 + 30, // Changed to position label below avatar
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
              .setOrigin(0.5, 0); // Changed from 0.5, 1 to 0.5, 0 for alignment

            // Setup keyboard input
            scene.cursors = this.input.keyboard?.createCursorKeys();
          }

          switchRoom(roomName: string) {
            const scene = this as GameScene;
            if (!scene.playerSprite || !scene.generalRoom || !scene.adultRoom)
              return;

            // Get dimensions
            const width = this.sys.game.canvas.width;
            const height = this.sys.game.canvas.height;

            if (roomName === "adult" && scene.currentRoom !== "adult") {
              // Hide general room
              scene.generalRoom.setVisible(false);
              // Show adult room
              scene.adultRoom.setVisible(true);

              // Move player to adult room entrance
              scene.playerSprite.x = 100;
              scene.playerSprite.y = height / 2;

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
              scene.playerSprite.x = width - 100;
              scene.playerSprite.y = height / 2;

              // Update current room
              scene.currentRoom = "general";
              setCurrentRoom("general");
            }
          }

          update() {
            const scene = this as GameScene;
            if (!scene.playerSprite || !scene.cursors || !scene.playerLabel)
              return;

            // Get dimensions
            const width = this.sys.game.canvas.width;
            const height = this.sys.game.canvas.height;

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

            // Update label position to follow sprite (BELOW the player)
            scene.playerLabel.x = scene.playerSprite.x;
            scene.playerLabel.y = scene.playerSprite.y + 30;

            // Check if player is near the door or exit
            if (scene.doorZone && scene.currentRoom === "general") {
              const bounds = scene.doorZone.getBounds();
              const playerInDoorZone = Phaser.Geom.Rectangle.Contains(
                bounds,
                scene.playerSprite.x,
                scene.playerSprite.y
              );

              // If player enters door zone and wasn't already in it
              if (playerInDoorZone && !scene.nearDoor) {
                scene.nearDoor = true;
                // Check if player can access adult room
                if (scene.isAdult !== true) {
                  // Show a notification
                  if (!this.registry.get("adultsOnlyMessageShown")) {
                    alert(
                      "Adults Only! You need to verify your age to enter this room."
                    );
                    this.registry.set("adultsOnlyMessageShown", true);
                  }
                } else {
                  // Switch to adult room automatically
                  this.switchRoom("adult");
                  // If entering adult room, show token reward notification
                  alert(
                    "🎉 You earned 5 FRENG tokens for entering the adults-only lounge!"
                  );
                }
              } else if (!playerInDoorZone && scene.nearDoor) {
                scene.nearDoor = false;
              }
            }

            // Check if player is near the exit
            if (scene.exitZone && scene.currentRoom === "adult") {
              const bounds = scene.exitZone.getBounds();
              const playerInExitZone = Phaser.Geom.Rectangle.Contains(
                bounds,
                scene.playerSprite.x,
                scene.playerSprite.y
              );

              // If player enters exit zone and wasn't already in it
              if (playerInExitZone && !scene.nearExit) {
                scene.nearExit = true;
                // Switch back to general room automatically
                this.switchRoom("general");
              } else if (!playerInExitZone && scene.nearExit) {
                scene.nearExit = false;
              }
            }

            // Add boundaries to keep player in the room
            const margin = 50;
            if (scene.playerSprite.x < margin) scene.playerSprite.x = margin;
            if (scene.playerSprite.x > width - margin)
              scene.playerSprite.x = width - margin;
            if (scene.playerSprite.y < margin) scene.playerSprite.y = margin;
            if (scene.playerSprite.y > height - margin)
              scene.playerSprite.y = height - margin;
          }
        }

        // Initialize the game
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          // Use 100% width and calculate height based on aspect ratio
          width: window.innerWidth,
          height: window.innerHeight,
          parent: gameRef.current,
          scene: [MainScene],
          physics: {
            default: "arcade",
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          scale: {
            mode: Phaser.Scale.RESIZE, // Change to RESIZE mode to fill page
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: "100%",
            height: "100%",
          },
          backgroundColor: "#000000",
          // Disable Canvas scrolling
          disableContextMenu: true,
          render: {
            pixelArt: false,
            antialias: true,
            antialiasGL: true,
          },
          // Add resize handler
          callbacks: {
            postBoot: (game) => {
              // Handle window resize
              window.addEventListener("resize", () => {
                game.scale.resize(window.innerWidth, window.innerHeight);
              });
            },
          },
        };

        const game = new Phaser.Game(config);
        gameInstanceRef.current = game;
      }
    };

    loadPhaser();

    // Make sure to clean up the game instance when component unmounts
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [address, isAdult]);

  if (!address) {
    return <div>Please connect your wallet to play</div>;
  }

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden">
      <div ref={gameRef} className="w-full h-full" />
    </div>
  );
}
