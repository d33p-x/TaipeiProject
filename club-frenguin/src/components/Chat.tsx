"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";

interface ChatProps {
  room: string;
}

// Simple mock data for demo purposes
const mockMessages = {
  general: [
    { id: 1, sender: "Club Bot", message: "Welcome to Club Frenguin!" },
    {
      id: 2,
      sender: "0x1234...abcd",
      message: "Hey everyone, what's up?",
    },
    {
      id: 3,
      sender: "0xabcd...5678",
      message: "Just exploring this cool virtual world!",
    },
  ],
  "adults-only": [
    {
      id: 1,
      sender: "Club Bot",
      message: "Welcome to the Adults Only lounge!",
    },
    {
      id: 2,
      sender: "0xdef1...2345",
      message: "This is where all the cool adults hang out.",
    },
  ],
};

export default function Chat({ room }: ChatProps) {
  const { address } = useAccount();
  const [messages, setMessages] = useState(
    mockMessages[room as keyof typeof mockMessages] || []
  );
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastSpeechBubbleId, setLastSpeechBubbleId] = useState<number | null>(
    null
  );

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !address) return;

    const newMsg = {
      id: Date.now(),
      sender: `${address.slice(0, 6)}...${address.slice(-4)}`,
      message: newMessage.trim(),
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");

    // Set this message to be displayed as a speech bubble
    setLastSpeechBubbleId(newMsg.id);

    console.log("Dispatching chat event with message:", newMessage.trim());

    try {
      // Dispatch a direct chat message event for the Phaser scene
      const directChatEvent = new CustomEvent("direct_chat_message", {
        detail: {
          message: newMessage.trim(),
          room,
          sender: `${address.slice(0, 6)}...${address.slice(-4)}`,
          id: newMsg.id,
        },
        bubbles: true,
      });
      window.dispatchEvent(directChatEvent);

      // Method 1: Using CustomEvent constructor
      const chatEvent = new CustomEvent("chat_message", {
        detail: {
          message: newMessage.trim(),
          room,
          sender: `${address.slice(0, 6)}...${address.slice(-4)}`,
          id: newMsg.id,
        },
        bubbles: true,
      });
      window.dispatchEvent(chatEvent);

      // Method 2: Using document.createEvent (for older browsers)
      const backupEvent = document.createEvent("CustomEvent");
      backupEvent.initCustomEvent("chat_message_backup", true, true, {
        message: newMessage.trim(),
        room,
        sender: `${address.slice(0, 6)}...${address.slice(-4)}`,
        id: newMsg.id,
      });
      window.dispatchEvent(backupEvent);

      console.log("Chat events dispatched successfully");
    } catch (error) {
      console.error("Error dispatching chat event:", error);
    }
  };

  return (
    <div className="chat-container">
      {/* WoW-style chat log in bottom left */}
      <div className="bg-black bg-opacity-60 rounded-md p-2 max-w-xs text-white text-xs h-32 overflow-y-auto flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.map((msg) => (
            <div key={msg.id} className="mb-1">
              <span
                className={`font-semibold ${
                  msg.sender === "Club Bot"
                    ? "text-yellow-400"
                    : "text-blue-300"
                }`}
              >
                {msg.sender}:
              </span>{" "}
              <span>{msg.message}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-1 flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white text-xs px-2 py-1 rounded-l outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white text-xs rounded-r px-2"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// Create a separate SpeechBubble component that can be exported
export function SpeechBubble({
  message,
  senderX,
  senderY,
}: {
  message: string;
  senderX: number;
  senderY: number;
}) {
  return (
    <div
      className="absolute bg-white border-2 border-black rounded-lg p-2 shadow-lg text-sm max-w-xs z-50"
      style={{
        left: senderX,
        top: senderY - 80, // Position higher above the player
        transform: "translateX(-50%)",
        maxWidth: "200px",
        minWidth: "80px",
        textAlign: "center",
        fontWeight: "bold",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div className="relative">
        {message}
        {/* Triangle pointer at bottom */}
        <div
          className="absolute w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"
          style={{
            bottom: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            filter: "drop-shadow(0 2px 1px rgba(0, 0, 0, 0.3))",
          }}
        ></div>
        {/* Border triangle for outline effect */}
        <div
          className="absolute w-0 h-0 border-l-10 border-r-10 border-t-10 border-l-transparent border-r-transparent border-t-black"
          style={{
            bottom: "-11px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: -1,
          }}
        ></div>
      </div>
    </div>
  );
}
