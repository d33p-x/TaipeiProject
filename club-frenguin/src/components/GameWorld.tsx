"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import {
  useAgeVerification,
  CharacterType,
} from "@/providers/AgeVerificationProvider";
import { SpeechBubble } from "./Chat";
import { ethers } from "ethers";

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
  ensBoothZone?: Phaser.GameObjects.Zone;
  nearDoor?: boolean;
  nearExit?: boolean;
  nearKidsDoor?: boolean;
  nearKidsExit?: boolean;
  nearEnsBooth?: boolean;
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
  const [userSubdomain, setUserSubdomain] = useState<string | null>(null);

  // Track active timers to ensure proper cleanup
  const activeTimers = useRef<Phaser.Time.TimerEvent[]>([]);
  const activeContainers = useRef<Phaser.GameObjects.Container[]>([]);

  // Add ENS registration state
  const [showEnsRegistration, setShowEnsRegistration] = useState(false);
  const [subdomainName, setSubdomainName] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Contract addresses
  const registryAddress = "0x257ed5b68c2a32273db8490e744028a63acc771f";
  const registrarAddress = "0x38Fc7Af48B92F00AB5508d88648FF9a4C9D89b5E";

  // Add function to fetch user's subdomain
  const fetchUserSubdomain = async () => {
    if (!address) return;

    try {
      // Connect to Base
      // @ts-ignore - ethereum is injected by MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Use the addressToLabel function to directly get the subdomain
      const registrarAbi = [
        "function addressToLabel(address) external view returns (string)",
      ];

      const registrarContract = new ethers.Contract(
        registrarAddress,
        registrarAbi,
        provider
      );

      // Call the addressToLabel function to get the user's subdomain
      const label = await registrarContract.addressToLabel(address);

      // If a label was found, set it as the user's subdomain
      if (label && label !== "") {
        console.log("Found ENS subdomain for address:", label);
        setUserSubdomain(label);
      } else {
        console.log("No subdomain found for address");
        // Clear any previously set subdomain
        setUserSubdomain(null);
      }
    } catch (error) {
      console.error("Error fetching user subdomain:", error);
    }
  };

  // Call the function when component mounts or address changes
  useEffect(() => {
    if (address) {
      // Fetch on initial load
      fetchUserSubdomain();

      // Set up a periodic refresh every 30 seconds to catch any changes
      const refreshInterval = setInterval(() => {
        fetchUserSubdomain();
      }, 30000);

      // Also fetch on window focus (when user comes back to the tab)
      const handleFocus = () => fetchUserSubdomain();
      window.addEventListener("focus", handleFocus);

      // Clean up
      return () => {
        clearInterval(refreshInterval);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [address]);

  // Remove all ENS name effects
  useEffect(() => {
    // Optimize event listening to use fewer handlers
    const handleChatEvent = (e: CustomEvent) => {
      const { message, id } = e.detail;

      // Don't set activeSpeechBubble - only use the in-game speech bubbles
      // The in-game showSpeechBubble function will handle this directly

      // We no longer need this React-based speech bubble
      // setActiveSpeechBubble({
      //   id,
      //   message,
      //   timestamp: Date.now(),
      // });

      // No need for a separate timeout to clear the bubble
      // The in-game system already handles cleanup
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

  // Emit event when player interacts with ENS booth
  useEffect(() => {
    const handleEnsRegistration = () => {
      setShowEnsRegistration(true);
    };

    // Custom event for ENS registration from the game
    window.addEventListener(
      "ens_registration",
      handleEnsRegistration as EventListener
    );

    return () => {
      window.removeEventListener(
        "ens_registration",
        handleEnsRegistration as EventListener
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
            this.load.image("ensBooth", "/assets/ensBooth.png");
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

            // Add ENS Booth
            const ensBooth = this.add
              .image(width * 0.65, 100, "ensBooth")
              .setDisplaySize(200, 200);
            generalWorld.add(ensBooth);
            scene.generalObjects.push(ensBooth);

            // Add ENS Booth label
            const ensBoothLabel = this.add
              .text(width * 0.65, 210, "ENS Subdomains", {
                fontFamily: "Pixelify Sans",
                fontSize: "14px",
                color: "#FFFFFF",
                padding: { x: 3, y: 2 },
                stroke: "#000000",
                strokeThickness: 3,
              })
              .setOrigin(0.5);
            generalWorld.add(ensBoothLabel);
            scene.generalObjects.push(ensBoothLabel);

            // Add ENS booth interaction instructions
            const ensInstructions = this.add
              .text(width * 0.65, 240, "Walk here to register", {
                fontFamily: "Pixelify Sans",
                fontSize: "12px",
                color: "#FFFFFF",
                padding: { x: 3, y: 2 },
                stroke: "#000000",
                strokeThickness: 3,
              })
              .setOrigin(0.5);
            generalWorld.add(ensInstructions);
            scene.generalObjects.push(ensInstructions);

            // Add invisible zone for ENS booth interaction
            scene.ensBoothZone = this.add.zone(width * 0.65, 150, 220, 220);
            scene.ensBoothZone.setOrigin(0.5);
            scene.nearEnsBooth = false;

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

            // Add player label (wallet address or ENS name) - BELOW the avatar
            scene.playerLabel = this.add
              .text(
                width / 2,
                height / 2 + 45, // Move further down from 30 to 45
                address
                  ? userSubdomain
                    ? `${userSubdomain}.frenguin.eth`
                    : `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Player",
                {
                  fontFamily: "Arial",
                  fontSize: "16px", // Increase text size for better visibility
                  color: "#FFFFFF",
                  padding: { x: 4, y: 2 },
                  stroke: "#000000",
                  strokeThickness: 5, // Thicker stroke for better visibility
                }
              )
              .setOrigin(0.5, 0)
              .setDepth(10000); // Much higher depth to ensure it's on top

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

              // Make sure the player label is visible and positioned correctly
              if (scene.playerLabel && scene.playerSprite) {
                scene.playerLabel.x = scene.playerSprite.x;
                scene.playerLabel.y = scene.playerSprite.y + 45;
                scene.playerLabel.setVisible(true);
                scene.playerLabel.setDepth(10000);
              }

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

              // Make sure the player label is visible and positioned correctly
              if (scene.playerLabel && scene.playerSprite) {
                scene.playerLabel.x = scene.playerSprite.x;
                scene.playerLabel.y = scene.playerSprite.y + 45;
                scene.playerLabel.setVisible(true);
                scene.playerLabel.setDepth(10000);
              }

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

              // Make sure the player label is visible and positioned correctly
              if (scene.playerLabel && scene.playerSprite) {
                scene.playerLabel.x = scene.playerSprite.x;
                scene.playerLabel.y = scene.playerSprite.y + 45;
                scene.playerLabel.setVisible(true);
                scene.playerLabel.setDepth(10000);
              }

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

            // Update player label position to follow sprite
            if (scene.playerLabel && scene.playerSprite) {
              // Position the label below the player sprite
              scene.playerLabel.x = scene.playerSprite.x;
              scene.playerLabel.y = scene.playerSprite.y + 45; // Position below player

              // Ensure the label is visible and on top
              scene.playerLabel.setVisible(true);
              scene.playerLabel.setDepth(10000);
            }

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

            // Check if player is near the ENS booth
            if (scene.ensBoothZone && scene.currentRoom === "general") {
              const bounds = scene.ensBoothZone.getBounds();
              const playerInEnsZone = Phaser.Geom.Rectangle.Contains(
                bounds,
                scene.playerSprite.x,
                scene.playerSprite.y
              );

              // If player enters ENS booth zone
              if (playerInEnsZone && !scene.nearEnsBooth) {
                scene.nearEnsBooth = true;

                // Trigger ENS registration
                window.dispatchEvent(
                  new CustomEvent("ens_registration", {
                    detail: {
                      address: scene.address,
                      isVerified: scene.isAdult !== null,
                    },
                  })
                );

                // Show a message bubble
                scene.showAccessDeniedMessage?.(
                  "Welcome to the ENS registration booth! Create your subdomain."
                );
              } else if (!playerInEnsZone) {
                scene.nearEnsBooth = false;
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

  // Add function to handle ENS registration
  const handleRegisterSubdomain = async () => {
    if (!subdomainName || !address) {
      setStatusMessage("Please enter a subdomain name.");
      return;
    }

    setRegistrationStatus("loading");
    setStatusMessage("Registering your subdomain...");

    try {
      // First, get verification signature from our API
      const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      const verificationResponse = await fetch("/api/ens-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, timestamp }),
      });

      if (!verificationResponse.ok) {
        throw new Error("Failed to get verification signature");
      }

      const { signature } = await verificationResponse.json();

      // Connect to Base
      // @ts-ignore - ethereum is injected by MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Registrar ABI with the full function signature
      const registrarAbi = [
        "function register(string calldata label, address owner, uint256 timestamp, bytes memory signature) external",
      ];

      // Create contract instance
      const registrarContract = new ethers.Contract(
        registrarAddress,
        registrarAbi,
        signer
      );

      // Register the subdomain with all required parameters
      const tx = await registrarContract.register(
        subdomainName,
        address,
        timestamp,
        signature
      );
      setStatusMessage("Transaction submitted. Waiting for confirmation...");

      // Wait for confirmation
      await tx.wait();

      // Registration successful
      setRegistrationStatus("success");
      setStatusMessage(
        `Successfully registered ${subdomainName}.frenguin.eth!`
      );

      // Update the state with the new subdomain to display it immediately
      setUserSubdomain(subdomainName);

      // Refresh the user's subdomain from the blockchain
      // in case other updates were made
      setTimeout(() => {
        fetchUserSubdomain();
      }, 2000); // Wait a bit for the blockchain to update

      // Show success message in-game
      if (gameInstanceRef.current) {
        const scene = gameInstanceRef.current.scene.getScene(
          "MainScene"
        ) as GameScene;
        if (scene && scene.showAccessDeniedMessage) {
          scene.showAccessDeniedMessage(
            `Success! Registered ${subdomainName}.frenguin.eth!`
          );
        }
      }

      // Close registration dialog after success
      setTimeout(() => {
        setShowEnsRegistration(false);
        setStatusMessage("");
        setRegistrationStatus("idle");
        setSubdomainName("");
      }, 3000);
    } catch (error) {
      console.error("Registration error:", error);
      setRegistrationStatus("error");
      setStatusMessage("Error registering subdomain. Please try again.");
    }
  };

  // Remove methods that dealt with ENS name display
  const setEnsNameOverride = (name: string) => {
    // Simply show a success message
    if (gameInstanceRef.current) {
      const scene = gameInstanceRef.current.scene.getScene(
        "MainScene"
      ) as GameScene;
      if (scene && scene.showAccessDeniedMessage) {
        scene.showAccessDeniedMessage(`Set name to: ${name}.frenguin.eth!`);
      }
    }
  };

  // Add a useEffect to update the player label when userSubdomain changes
  useEffect(() => {
    if (!gameInstanceRef.current || !userSubdomain) return;

    const scene = gameInstanceRef.current.scene.getScene(
      "MainScene"
    ) as GameScene;
    if (scene && scene.playerLabel) {
      scene.playerLabel.setText(`${userSubdomain}.frenguin.eth`);
    }
  }, [userSubdomain]);

  if (!address) {
    return <div>Please connect your wallet to play</div>;
  }

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden">
      <div ref={gameRef} className="w-full h-full" />

      {/* ENS Registration Modal */}
      {showEnsRegistration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
          <div className="bg-gray-900 p-8 rounded-lg border-4 border-blue-500 w-full max-w-lg">
            <h2 className="text-2xl font-pixel text-white mb-4">
              Register Your ENS Subdomain
            </h2>

            <p className="text-gray-300 mb-6 font-pixel">
              Create your own personalized .frenguin.eth name that will show up
              in-game below your character!
            </p>

            <div className="mb-6">
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  className="bg-gray-800 text-white px-4 py-3 rounded-l border-2 border-blue-700 font-pixel text-lg w-full focus:outline-none focus:border-blue-500"
                  placeholder="Enter subdomain name"
                  value={subdomainName}
                  onChange={(e) => setSubdomainName(e.target.value)}
                />
                <div className="bg-gray-700 px-3 py-3 text-gray-300 rounded-r border-y-2 border-r-2 border-blue-700 font-pixel text-lg">
                  .frenguin.eth
                </div>
              </div>
              <p className="text-sm text-gray-400 font-pixel">
                Choose a name between 3-20 characters. Only letters, numbers,
                and hyphens allowed.
              </p>
            </div>

            <div className="mb-6">
              <button
                className={`w-full py-3 font-pixel text-white text-lg rounded ${
                  registrationStatus === "loading"
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
                onClick={handleRegisterSubdomain}
                disabled={registrationStatus === "loading"}
              >
                {registrationStatus === "loading"
                  ? "Registering..."
                  : "Register"}
              </button>

              {statusMessage && (
                <p
                  className={`mt-4 text-center font-pixel ${
                    registrationStatus === "error"
                      ? "text-red-400"
                      : registrationStatus === "success"
                      ? "text-green-400"
                      : "text-blue-300"
                  }`}
                >
                  {statusMessage}
                </p>
              )}
            </div>

            <div className="mb-6 bg-blue-900 p-6 rounded border-2 border-blue-700">
              <p className="text-white text-lg font-pixel mb-4">
                If your name is not registering correctly, you can manually set
                it:
              </p>
              <div className="flex mb-4">
                <input
                  type="text"
                  placeholder="Enter your subdomain"
                  className="bg-gray-900 text-white px-4 py-3 rounded-l border-2 border-blue-700 font-pixel text-base w-full focus:outline-none focus:border-blue-500"
                  value={subdomainName}
                  onChange={(e) => setSubdomainName(e.target.value)}
                />
                <button
                  className="px-4 py-2 bg-green-600 text-white text-base font-pixel rounded-r border-y-2 border-r-2 border-green-700 hover:bg-green-500"
                  onClick={(e) => {
                    e.preventDefault();
                    if (subdomainName) {
                      setEnsNameOverride(subdomainName);
                      setShowEnsRegistration(false);
                    }
                  }}
                >
                  Set
                </button>
              </div>

              {/* Add refresh button */}
              <div className="mt-4 flex justify-center">
                <button
                  className="px-4 py-2 bg-blue-600 text-white text-base font-pixel rounded border-2 border-blue-700 hover:bg-blue-500 flex items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    fetchUserSubdomain();
                    setStatusMessage("Refreshing subdomain data...");
                    setTimeout(() => {
                      setStatusMessage(
                        userSubdomain
                          ? `Found subdomain: ${userSubdomain}.frenguin.eth`
                          : "No subdomain found for this address"
                      );
                    }, 1500);
                  }}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    ></path>
                  </svg>
                  Refresh Name Data
                </button>
              </div>
            </div>

            <button
              className="px-6 py-3 bg-gray-700 text-white text-lg font-pixel rounded border-2 border-gray-600 hover:bg-gray-600 transition"
              onClick={() => setShowEnsRegistration(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Speech Bubble - Removed to fix flickering issue */}
      {/* We're now only using the in-game speech bubbles */}
    </div>
  );
}
