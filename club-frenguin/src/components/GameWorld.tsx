"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import {
  useAgeVerification,
  CharacterType,
} from "@/providers/AgeVerificationProvider";
import { SpeechBubble } from "./Chat";

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
  characterType?: CharacterType;
  currentRoom?: string;
  generalRoom?: Phaser.GameObjects.Container;
  adultRoom?: Phaser.GameObjects.Container;
  kidsRoom?: Phaser.GameObjects.Container;
  generalObjects?: Phaser.GameObjects.Components.Visible[];
  adultObjects?: Phaser.GameObjects.Components.Visible[];
  kidsObjects?: Phaser.GameObjects.Components.Visible[];
  doorZone?: Phaser.GameObjects.Zone;
  exitZone?: Phaser.GameObjects.Zone;
  kidsDoorZone?: Phaser.GameObjects.Zone;
  kidsExitZone?: Phaser.GameObjects.Zone;
  nearDoor?: boolean;
  nearExit?: boolean;
  nearKidsDoor?: boolean;
  nearKidsExit?: boolean;
  playerDirection?: string;

  // New method to show error messages
  showAccessDeniedMessage?: (message: string) => void;

  // Performance optimization properties
  lastUpdateTime?: number;
  updateCounter?: number;
};

type SpeechBubbleMessage = {
  id: number;
  message: string;
  timestamp: number;
};

export default function GameWorld() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const { address } = useAccount();
  const { isAdult, selectedCharacter } = useAgeVerification();
  const [currentRoom, setCurrentRoom] = useState<string>("general");
  const [activeSpeechBubble, setActiveSpeechBubble] =
    useState<SpeechBubbleMessage | null>(null);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });

  // Track active timers to ensure proper cleanup
  const activeTimers = useRef<Phaser.Time.TimerEvent[]>([]);
  const activeContainers = useRef<Phaser.GameObjects.Container[]>([]);

  // Optimize event listening to use fewer handlers
  useEffect(() => {
    // One unified handler for chat messages to reduce event listeners
    const handleChatEvent = (e: CustomEvent) => {
      const { message, id } = e.detail;

      // Only show speech bubbles for the current player's messages
      setActiveSpeechBubble({
        id,
        message,
        timestamp: Date.now(),
      });

      // Hide speech bubble after 5 seconds instead of 8 for better performance
      setTimeout(() => {
        setActiveSpeechBubble(null);
      }, 5000);
    };

    // Add a single event listener
    window.addEventListener("chat_message", handleChatEvent as EventListener);
    window.addEventListener(
      "direct_chat_message",
      handleChatEvent as EventListener
    );

    // Clean up all event listeners
    return () => {
      window.removeEventListener(
        "chat_message",
        handleChatEvent as EventListener
      );
      window.removeEventListener(
        "direct_chat_message",
        handleChatEvent as EventListener
      );
    };
  }, []);

  useEffect(() => {
    // Clear the container before creating a new game instance to prevent doubling
    if (gameRef.current) {
      gameRef.current.innerHTML = "";
    }

    if (!gameRef.current || !address) return;

    // Cleanup previous game instance if exists
    if (gameInstanceRef.current) {
      // Make sure all timers are destroyed
      activeTimers.current.forEach((timer) => {
        if (timer && timer.remove) {
          timer.remove();
        }
      });

      // Clear the active timers
      activeTimers.current = [];

      // Destroy all active containers
      activeContainers.current.forEach((container) => {
        if (container && container.destroy) {
          container.destroy();
        }
      });

      // Clear the active containers
      activeContainers.current = [];

      // Destroy the game
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
            // Load all player avatar variations based on gender and age
            this.load.image("playerMale", "/assets/playerMale.png");
            this.load.image("playerMaleBack", "/assets/playerMaleBack.png");
            this.load.image("playerFemale", "/assets/playerFemale.png");
            this.load.image("playerFemaleBack", "/assets/playerFemaleBack.png");
            this.load.image("playerKid", "/assets/playerKid.png");
            this.load.image("playerKidBack", "/assets/playerKidBack.png");
            this.load.image("playerMaleBeer", "/assets/playerMaleBeer.png");
            this.load.image(
              "playerMaleBeerBack",
              "/assets/playerMaleBeerBack.png"
            );
            this.load.image(
              "playerFemaleChampagne",
              "/assets/playerFemaleChampagne.png"
            );
            this.load.image(
              "playerFemaleChampagneBack",
              "/assets/playerFemaleChampagneBack.png"
            );

            // Load other game assets
            this.load.image("grass", "/assets/grass.png");
            this.load.image("door", "/assets/door.png");
          }

          create() {
            const scene = this as GameScene;
            scene.address = address;
            scene.isAdult = isAdult;
            scene.characterType = selectedCharacter;
            scene.otherPlayers = new Map();
            scene.currentRoom = "general";
            scene.generalObjects = [];
            scene.adultObjects = [];
            scene.kidsObjects = [];
            scene.nearDoor = false;
            scene.nearExit = false;
            scene.nearKidsDoor = false;
            scene.nearKidsExit = false;

            // Set up camera
            this.cameras.main.setBackgroundColor("#000000");

            // Get the actual game dimensions for responsive sizing
            const width = this.sys.game.canvas.width;
            const height = this.sys.game.canvas.height;
            this.cameras.main.setBounds(0, 0, width, height);

            // Create world container for each room
            const generalWorld = this.add.container(0, 0);
            const adultWorld = this.add.container(0, 0);
            const kidsWorld = this.add.container(0, 0);

            // Initially hide adult and kids world
            adultWorld.setVisible(false);
            kidsWorld.setVisible(false);

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
                fontFamily: "Pixelify Sans",
                fontSize: "20px",
                color: "#FFFFFF",
                padding: { x: 5, y: 3 },
                stroke: "#000000",
                strokeThickness: 4,
              })
              .setOrigin(0.5);
            generalWorld.add(generalRoomLabel);
            scene.generalObjects.push(generalRoomLabel);

            // Add door to adult room visual (no longer interactive)
            const adultRoomDoor = this.add
              .image(width - 70, height / 2, "door")
              .setDisplaySize(70, 140)
              .setTint(0xaa0000); // Keep the red tint to distinguish it
            generalWorld.add(adultRoomDoor);
            scene.generalObjects.push(adultRoomDoor);

            // Add door to kids room visual
            const kidsRoomDoor = this.add
              .image(70, height / 2, "door")
              .setDisplaySize(70, 140)
              .setTint(0x00aa00); // Green tint for kids room
            generalWorld.add(kidsRoomDoor);
            scene.generalObjects.push(kidsRoomDoor);

            // Add invisible door zone that will detect player proximity for adults room
            scene.doorZone = this.add.zone(width - 100, height / 2, 200, 250);
            scene.doorZone.setOrigin(0.5);

            // Add invisible door zone that will detect player proximity for kids room
            scene.kidsDoorZone = this.add.zone(100, height / 2, 200, 250);
            scene.kidsDoorZone.setOrigin(0.5);

            // Visual instructions for adult room
            const doorInstructions = this.add
              .text(width - 70, height / 2 + 70, "Walk here to enter", {
                fontFamily: "Pixelify Sans",
                fontSize: "14px",
                color: "#FFFFFF",
                padding: { x: 3, y: 2 },
                stroke: "#000000",
                strokeThickness: 3,
              })
              .setOrigin(0.5);
            generalWorld.add(doorInstructions);
            scene.generalObjects.push(doorInstructions);

            const doorLabel = this.add
              .text(width - 70, height / 2 - 20, "18+", {
                fontFamily: "Pixelify Sans",
                fontSize: "24px",
                color: "#FFFFFF",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 4,
              })
              .setOrigin(0.5);
            generalWorld.add(doorLabel);
            scene.generalObjects.push(doorLabel);

            // Visual instructions for kids room
            const kidsDoorInstructions = this.add
              .text(70, height / 2 + 70, "Walk here to enter", {
                fontFamily: "Pixelify Sans",
                fontSize: "14px",
                color: "#FFFFFF",
                padding: { x: 3, y: 2 },
                stroke: "#000000",
                strokeThickness: 3,
              })
              .setOrigin(0.5);
            generalWorld.add(kidsDoorInstructions);
            scene.generalObjects.push(kidsDoorInstructions);

            const kidsDoorLabel = this.add
              .text(70, height / 2 - 20, "Kids Only", {
                fontFamily: "Pixelify Sans",
                fontSize: "24px",
                color: "#FFFFFF",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 4,
              })
              .setOrigin(0.5);
            generalWorld.add(kidsDoorLabel);
            scene.generalObjects.push(kidsDoorLabel);

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
                fontFamily: "Pixelify Sans",
                fontSize: "20px",
                color: "#FFFFFF",
                padding: { x: 5, y: 3 },
                stroke: "#000000",
                strokeThickness: 4,
              })
              .setOrigin(0.5);
            adultWorld.add(adultRoomLabel);
            scene.adultObjects.push(adultRoomLabel);

            // Add door back to general room visual (no longer interactive)
            const backToDoor = this.add
              .image(70, height / 2, "door")
              .setDisplaySize(70, 140)
              .setTint(0x0000aa); // Keep the blue tint
            adultWorld.add(backToDoor);
            scene.adultObjects.push(backToDoor);

            // Add invisible exit zone that will detect player proximity
            scene.exitZone = this.add.zone(100, height / 2, 200, 250);
            scene.exitZone.setOrigin(0.5);

            // Add visual instructions
            const exitInstructions = this.add
              .text(70, height / 2 + 70, "Walk here to exit", {
                fontFamily: "Pixelify Sans",
                fontSize: "14px",
                color: "#FFFFFF",
                padding: { x: 3, y: 2 },
                stroke: "#000000",
                strokeThickness: 3,
              })
              .setOrigin(0.5);
            adultWorld.add(exitInstructions);
            scene.adultObjects.push(exitInstructions);

            const backText = this.add
              .text(70, height / 2 - 20, "Exit", {
                fontFamily: "Pixelify Sans",
                fontSize: "24px",
                color: "#FFFFFF",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 4,
              })
              .setOrigin(0.5);
            adultWorld.add(backText);
            scene.adultObjects.push(backText);

            // Kids room
            // Add kids room background and objects
            const kidsBackground = this.add
              .image(width / 2, height / 2, "grass")
              .setDisplaySize(width, height);
            // Add a green tint to kids room
            kidsBackground.setTint(0xaaffaa);
            kidsWorld.add(kidsBackground);
            scene.kidsObjects.push(kidsBackground);

            // Add room label
            const kidsRoomLabel = this.add
              .text(width / 2, 80, "Kids Only Room", {
                fontFamily: "Pixelify Sans",
                fontSize: "20px",
                color: "#FFFFFF",
                padding: { x: 5, y: 3 },
                stroke: "#000000",
                strokeThickness: 4,
              })
              .setOrigin(0.5);
            kidsWorld.add(kidsRoomLabel);
            scene.kidsObjects.push(kidsRoomLabel);

            // Add door back to general room visual
            const kidsExitDoor = this.add
              .image(width - 70, height / 2, "door")
              .setDisplaySize(70, 140)
              .setTint(0x0000aa); // Blue tint for exit
            kidsWorld.add(kidsExitDoor);
            scene.kidsObjects.push(kidsExitDoor);

            // Add invisible exit zone that will detect player proximity
            scene.kidsExitZone = this.add.zone(
              width - 100,
              height / 2,
              200,
              250
            );
            scene.kidsExitZone.setOrigin(0.5);

            // Add visual instructions
            const kidsExitInstructions = this.add
              .text(width - 70, height / 2 + 70, "Walk here to exit", {
                fontFamily: "Pixelify Sans",
                fontSize: "14px",
                color: "#FFFFFF",
                padding: { x: 3, y: 2 },
                stroke: "#000000",
                strokeThickness: 3,
              })
              .setOrigin(0.5);
            kidsWorld.add(kidsExitInstructions);
            scene.kidsObjects.push(kidsExitInstructions);

            const kidsExitText = this.add
              .text(width - 70, height / 2 - 20, "Exit", {
                fontFamily: "Pixelify Sans",
                fontSize: "24px",
                color: "#FFFFFF",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 4,
              })
              .setOrigin(0.5);
            kidsWorld.add(kidsExitText);
            scene.kidsObjects.push(kidsExitText);

            // Store world containers for reference
            scene.generalRoom = generalWorld;
            scene.adultRoom = adultWorld;
            scene.kidsRoom = kidsWorld;

            // Add player with the selected character
            scene.playerSprite = this.add.sprite(
              width / 2,
              height / 2,
              selectedCharacter || "playerMale" // Default fallback
            );

            // Player direction state
            scene.playerDirection = "down"; // Default facing down

            // Add player label (wallet address) - BELOW the avatar
            scene.playerLabel = this.add
              .text(
                width / 2,
                height / 2 + 45, // Move further down from 30 to 45
                address
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
              .setOrigin(0.5, 0); // Changed from 0.5, 1 to 0.5, 0 for alignment

            // Setup keyboard input
            scene.cursors = this.input.keyboard?.createCursorKeys();

            // Add direct game scene method to show speech bubbles
            // This allows creating speech bubbles directly in the Phaser scene
            const showSpeechBubble = (text: string) => {
              // First remove any existing speech bubbles to prevent overlap
              this.children.list.forEach((child) => {
                if (
                  child instanceof Phaser.GameObjects.Container &&
                  child.name === "speechBubble"
                ) {
                  child.destroy();
                }
              });

              const bubble = this.add.graphics();
              // White background with black border
              bubble.fillStyle(0xffffff, 1);
              bubble.lineStyle(2, 0x000000, 1);

              // Create rounded rectangle for bubble
              bubble.fillRoundedRect(0, 0, 200, 50, 10);
              bubble.strokeRoundedRect(0, 0, 200, 50, 10);

              // Add text
              const message = this.add
                .text(100, 25, text, {
                  fontFamily: "Arial",
                  fontSize: "14px",
                  color: "#000000",
                  align: "center",
                  wordWrap: { width: 180 },
                })
                .setOrigin(0.5);

              // Create container to group bubble and text
              const container = this.add.container(
                scene.playerSprite!.x,
                scene.playerSprite!.y - 100 // Positioned higher above the player
              );
              container.name = "speechBubble"; // Give it a name for easier cleanup
              container.add([bubble, message]);

              // Track this container for cleanup
              activeContainers.current.push(container);

              // Follow player - use a more efficient update approach
              const followTimer = this.time.addEvent({
                delay: 100, // Less frequent updates (100ms instead of 50ms)
                callback: () => {
                  if (scene.playerSprite) {
                    container.x = scene.playerSprite.x;
                    container.y = scene.playerSprite.y - 100;
                  }
                },
                repeat: 49, // 50 repeats = 5 seconds total
              });

              // Track for cleanup
              activeTimers.current.push(followTimer);

              // Auto remove after 5 seconds
              const removeTimer = this.time.delayedCall(5000, () => {
                container.destroy();

                // Remove from tracked containers
                const index = activeContainers.current.indexOf(container);
                if (index > -1) {
                  activeContainers.current.splice(index, 1);
                }
              });

              // Track for cleanup
              activeTimers.current.push(removeTimer);
            };

            // Add direct chat message listener to scene - use a single listener
            window.addEventListener("direct_chat_message", ((
              e: CustomEvent
            ) => {
              const { message } = e.detail;
              showSpeechBubble(message);
            }) as EventListener);

            // Add method to show access denied messages
            scene.showAccessDeniedMessage = (message: string) => {
              // Remove any existing access denied messages
              this.children.list.forEach((child) => {
                if (
                  child instanceof Phaser.GameObjects.Container &&
                  child.name === "accessDenied"
                ) {
                  child.destroy();
                }
              });

              // Create a red sign effect
              const messageBox = this.add.graphics();
              // Red background with dark border
              messageBox.fillStyle(0xff0000, 0.8);
              messageBox.lineStyle(3, 0x990000, 1);

              // Create rounded rectangle for sign
              messageBox.fillRoundedRect(0, 0, 260, 60, 10);
              messageBox.strokeRoundedRect(0, 0, 260, 60, 10);

              // Add text
              const messageText = this.add
                .text(130, 30, message, {
                  fontFamily: "Arial",
                  fontSize: "16px",
                  fontStyle: "bold",
                  color: "#FFFFFF",
                  align: "center",
                  wordWrap: { width: 240 },
                })
                .setOrigin(0.5);

              // Add warning icon
              const warningIcon = this.add
                .text(25, 30, "⚠️", {
                  fontSize: "20px",
                })
                .setOrigin(0.5);

              // Create container to group elements
              const container = this.add.container(
                scene.playerSprite!.x,
                scene.playerSprite!.y - 80
              );
              container.name = "accessDenied"; // Name for easier cleanup
              container.add([messageBox, messageText, warningIcon]);

              // Track this container for cleanup
              activeContainers.current.push(container);

              // Follow player for a short while - more efficient timer
              const followTimer = this.time.addEvent({
                delay: 100, // 100ms instead of 50ms for efficiency
                callback: () => {
                  if (scene.playerSprite) {
                    container.x = scene.playerSprite.x;
                    container.y = scene.playerSprite.y - 80;
                  }
                },
                repeat: 35, // ~3.5 seconds of following
              });

              // Track for cleanup
              activeTimers.current.push(followTimer);

              // Fade out animation - less frequent updates for better performance
              this.tweens.add({
                targets: container,
                alpha: { from: 1, to: 0 },
                ease: "Power1",
                duration: 500,
                delay: 3000, // 3 seconds instead of 3.5
                onComplete: () => {
                  container.destroy();
                  followTimer.remove();

                  // Remove from tracked containers
                  const index = activeContainers.current.indexOf(container);
                  if (index > -1) {
                    activeContainers.current.splice(index, 1);
                  }

                  // Remove from tracked timers
                  const timerIndex = activeTimers.current.indexOf(followTimer);
                  if (timerIndex > -1) {
                    activeTimers.current.splice(timerIndex, 1);
                  }
                },
              });
            };
          }

          switchRoom(roomName: string) {
            const scene = this as GameScene;
            if (
              !scene.playerSprite ||
              !scene.generalRoom ||
              !scene.adultRoom ||
              !scene.kidsRoom
            )
              return;

            // Get dimensions
            const width = this.sys.game.canvas.width;
            const height = this.sys.game.canvas.height;

            if (roomName === "adult" && scene.currentRoom !== "adult") {
              // Hide general room
              scene.generalRoom.setVisible(false);
              scene.kidsRoom.setVisible(false);
              // Show adult room
              scene.adultRoom.setVisible(true);

              // Move player to adult room entrance
              scene.playerSprite.x = 100;
              scene.playerSprite.y = height / 2;

              // Update current room
              scene.currentRoom = "adult";
              setCurrentRoom("adults-only");

              // Notify the application about room change (for parent components)
              window.postMessage(
                { type: "ROOM_CHANGE", room: "adults-only" },
                "*"
              );
            } else if (roomName === "kids" && scene.currentRoom !== "kids") {
              // Hide general room and adult room
              scene.generalRoom.setVisible(false);
              scene.adultRoom.setVisible(false);
              // Show kids room
              scene.kidsRoom.setVisible(true);

              // Move player to kids room entrance
              scene.playerSprite.x = width - 100;
              scene.playerSprite.y = height / 2;

              // Update current room
              scene.currentRoom = "kids";
              setCurrentRoom("kids-only");

              // Notify the application about room change
              window.postMessage(
                { type: "ROOM_CHANGE", room: "kids-only" },
                "*"
              );
            } else if (
              roomName === "general" &&
              scene.currentRoom !== "general"
            ) {
              // Hide adult and kids rooms
              scene.adultRoom.setVisible(false);
              scene.kidsRoom.setVisible(false);
              // Show general room
              scene.generalRoom.setVisible(true);

              // Move player to appropriate entrance based on which room they're exiting
              if (scene.currentRoom === "adult") {
                scene.playerSprite.x = width - 100;
                scene.playerSprite.y = height / 2;
              } else if (scene.currentRoom === "kids") {
                scene.playerSprite.x = 100;
                scene.playerSprite.y = height / 2;
              }

              // Update current room
              scene.currentRoom = "general";
              setCurrentRoom("general");

              // Notify the application about room change
              window.postMessage({ type: "ROOM_CHANGE", room: "general" }, "*");
            }
          }

          update() {
            // Optimize the update method to be more efficient
            const scene = this as GameScene;
            if (!scene.playerSprite || !scene.cursors || !scene.playerLabel)
              return;

            // Reduce frequency of position updates for better performance
            const now = this.time.now;
            if (scene.lastUpdateTime && now - scene.lastUpdateTime < 20) {
              // Skip update if less than 20ms since last update (max ~50fps)
              return;
            }
            scene.lastUpdateTime = now;

            // Get dimensions
            const width = this.sys.game.canvas.width;
            const height = this.sys.game.canvas.height;

            // Handle player movement
            const speed = 5;
            let moved = false;
            let direction = scene.playerDirection;

            // Store previous position before movement
            const prevX = scene.playerSprite.x;
            const prevY = scene.playerSprite.y;

            if (scene.cursors.left.isDown) {
              scene.playerSprite.x -= speed;
              direction = "left";
              moved = true;

              // Use the regular texture but flip it horizontally
              scene.playerSprite.setTexture(
                scene.characterType || "playerMale"
              );
              scene.playerSprite.setFlipX(true);
            } else if (scene.cursors.right.isDown) {
              scene.playerSprite.x += speed;
              direction = "right";
              moved = true;

              // Use the regular texture without flipping
              scene.playerSprite.setTexture(
                scene.characterType || "playerMale"
              );
              scene.playerSprite.setFlipX(false);
            }

            if (scene.cursors.up.isDown) {
              scene.playerSprite.y -= speed;
              direction = "up";
              moved = true;

              // Use the appropriate back texture for this character
              let backTexture = scene.characterType + "Back";
              scene.playerSprite.setTexture(backTexture);
              scene.playerSprite.setFlipX(false);
            } else if (scene.cursors.down.isDown) {
              scene.playerSprite.y += speed;
              direction = "down";
              moved = true;

              // Use front-facing texture
              scene.playerSprite.setTexture(
                scene.characterType || "playerMale"
              );
              scene.playerSprite.setFlipX(false);
            }

            // Update player direction state
            if (moved) {
              scene.playerDirection = direction;
            }

            // Update label position to follow sprite (BELOW the player)
            scene.playerLabel.x = scene.playerSprite.x;
            scene.playerLabel.y = scene.playerSprite.y + 30;

            // Update position state for speech bubble positioning - less frequently
            // Only update every 5th frame to reduce performance impact
            if (scene.updateCounter === undefined) {
              scene.updateCounter = 0;
            }
            scene.updateCounter++;

            if (scene.playerSprite && scene.updateCounter % 5 === 0) {
              // Get the canvas element
              const canvas = this.sys.game.canvas;
              // Get the position of the canvas on the page
              const canvasRect = canvas.getBoundingClientRect();

              // Convert game coordinates to screen coordinates
              const width = this.sys.game.canvas.width;
              const height = this.sys.game.canvas.height;

              // Use the ratio of the displayed canvas size to the internal game size
              const scaleX = canvasRect.width / width;
              const scaleY = canvasRect.height / height;

              const screenX = canvasRect.left + scene.playerSprite.x * scaleX;
              const screenY = canvasRect.top + scene.playerSprite.y * scaleY;

              // Update position state for speech bubble positioning
              setPlayerPosition({ x: screenX, y: screenY });
            }

            // Simple screen boundaries
            const margin = 50;
            if (scene.playerSprite.x < margin) scene.playerSprite.x = margin;
            if (scene.playerSprite.x > width - margin)
              scene.playerSprite.x = width - margin;
            if (scene.playerSprite.y < margin) scene.playerSprite.y = margin;
            if (scene.playerSprite.y > height - margin)
              scene.playerSprite.y = height - margin;

            // Check if player is near the door or exit
            if (scene.doorZone && scene.currentRoom === "general") {
              const bounds = scene.doorZone.getBounds();
              const playerInDoorZone = Phaser.Geom.Rectangle.Contains(
                bounds,
                scene.playerSprite.x,
                scene.playerSprite.y
              );

              // If player enters door zone
              if (playerInDoorZone) {
                // Check if player can access adult room
                if (scene.isAdult === true) {
                  // Switch to adult room automatically without popup
                  if (!scene.nearDoor) {
                    scene.nearDoor = true;
                    this.switchRoom("adult");
                  }
                } else if (scene.isAdult === false && !scene.nearDoor) {
                  // Show access denied message for kids
                  scene.nearDoor = true;
                  scene.showAccessDeniedMessage?.(
                    "Adults Only! You must be 18+ to enter this room."
                  );
                }
              } else {
                scene.nearDoor = false;
              }
            }

            // Check if player is near the kids door
            if (scene.kidsDoorZone && scene.currentRoom === "general") {
              const bounds = scene.kidsDoorZone.getBounds();
              const playerInKidsDoorZone = Phaser.Geom.Rectangle.Contains(
                bounds,
                scene.playerSprite.x,
                scene.playerSprite.y
              );

              // If player enters kids door zone
              if (playerInKidsDoorZone) {
                // Check if player is a kid (not an adult)
                if (scene.isAdult === false) {
                  // Switch to kids room automatically
                  if (!scene.nearKidsDoor) {
                    scene.nearKidsDoor = true;
                    this.switchRoom("kids");
                  }
                } else if (scene.isAdult === true && !scene.nearKidsDoor) {
                  // Show access denied message for adults
                  scene.nearKidsDoor = true;
                  scene.showAccessDeniedMessage?.(
                    "Kids Only! This room is only for users under 18."
                  );
                }
              } else {
                scene.nearKidsDoor = false;
              }
            }

            // Check if player is near the exit from adult room
            if (scene.exitZone && scene.currentRoom === "adult") {
              const bounds = scene.exitZone.getBounds();
              const playerInExitZone = Phaser.Geom.Rectangle.Contains(
                bounds,
                scene.playerSprite.x,
                scene.playerSprite.y
              );

              // If player enters exit zone
              if (playerInExitZone) {
                // Switch back to general room automatically
                if (!scene.nearExit) {
                  scene.nearExit = true;
                  this.switchRoom("general");
                }
              } else {
                scene.nearExit = false;
              }
            }

            // Check if player is near the exit from kids room
            if (scene.kidsExitZone && scene.currentRoom === "kids") {
              const bounds = scene.kidsExitZone.getBounds();
              const playerInKidsExitZone = Phaser.Geom.Rectangle.Contains(
                bounds,
                scene.playerSprite.x,
                scene.playerSprite.y
              );

              // If player enters exit zone
              if (playerInKidsExitZone) {
                // Switch back to general room automatically
                if (!scene.nearKidsExit) {
                  scene.nearKidsExit = true;
                  this.switchRoom("general");
                }
              } else {
                scene.nearKidsExit = false;
              }
            }
          }
        }

        // Initialize the game with optimized settings
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
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
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          backgroundColor: "#000000",
          disableContextMenu: true,
          render: {
            pixelArt: false,
            antialias: true,
            antialiasGL: true,
            // Limit FPS to 30 for lower resource usage
            powerPreference: "low-power",
          },
          // Optimize page resizing to be less frequent
          callbacks: {
            postBoot: (game) => {
              // Handle window resize with debounce for performance
              let resizeTimeout: NodeJS.Timeout;
              window.addEventListener("resize", () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                  game.scale.resize(window.innerWidth, window.innerHeight);
                }, 200); // 200ms debounce
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
      // Clear all event listeners
      window.removeEventListener("chat_message", () => {});
      window.removeEventListener("direct_chat_message", () => {});

      // Make sure all timers are destroyed
      activeTimers.current.forEach((timer) => {
        if (timer && timer.remove) {
          timer.remove();
        }
      });

      // Clear the active timers
      activeTimers.current = [];

      // Destroy all active containers
      activeContainers.current.forEach((container) => {
        if (container && container.destroy) {
          container.destroy();
        }
      });

      // Clear the active containers
      activeContainers.current = [];

      // Destroy the game instance
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [address, isAdult, selectedCharacter, setCurrentRoom]);

  if (!address) {
    return <div>Please connect your wallet to play</div>;
  }

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden">
      <div ref={gameRef} className="w-full h-full" />
    </div>
  );
}
