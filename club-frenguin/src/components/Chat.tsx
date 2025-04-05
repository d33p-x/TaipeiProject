"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";

interface ChatProps {
  room: string;
}

interface ChatMessage {
  id: number;
  sender: string;
  message: string;
}

// Simple mock data for demo purposes
const initialMockMessages = {
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
  "kids-only": [
    {
      id: 1,
      sender: "Club Bot",
      message: "Welcome to the Kids Only room!",
    },
    {
      id: 2,
      sender: "0xffff...0000",
      message: "No adults allowed in here, this is our space!",
    },
    {
      id: 3,
      sender: "0xabcd...kidz",
      message: "Anyone want to play a game?",
    },
  ],
};

// Store messages outside component to persist across room changes
const roomMessages: Record<string, ChatMessage[]> = {
  general: [...initialMockMessages.general],
  "adults-only": [...initialMockMessages["adults-only"]],
  "kids-only": [...initialMockMessages["kids-only"]],
};

export default function Chat({ room }: ChatProps) {
  const { address } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>(
    roomMessages[room] || []
  );
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update local state when room changes
  useEffect(() => {
    console.log(`Room changed to: ${room}`);
    console.log(`Messages for this room:`, roomMessages[room]);
    setMessages(roomMessages[room] || []);
  }, [room]);

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

    // Update both the local state and the persistent store
    roomMessages[room] = [...roomMessages[room], newMsg];
    setMessages(roomMessages[room]);
    setNewMessage("");

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
    } catch (error) {
      console.error("Error dispatching chat event:", error);
    }
  };

  return (
    <div className="chat-container">
      {/* WoW-style chat log in bottom left */}
      <div className="bg-black bg-opacity-60 rounded-md p-2 max-w-md text-white text-sm h-48 overflow-y-auto flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin chat-message">
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
            onKeyDown={(e) => {
              // Prevent space key from triggering any game controls
              if (e.key === " ") {
                e.stopPropagation();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white text-sm px-2 py-1 rounded-l outline-none chat-input"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white text-sm rounded-r px-2 font-pixel"
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
