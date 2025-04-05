"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { io, Socket } from "socket.io-client";

type ChatMessage = {
  id: string;
  sender: string;
  displayName: string;
  message: string;
  room: string;
  timestamp: number;
};

export default function Chat({ room = "general" }: { room?: string }) {
  const { address } = useAccount();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to socket server
  useEffect(() => {
    if (!address) return;

    // For MLP, we'll simulate socket connectivity
    // In a real implementation, we would connect to a real socket.io server
    const mockSocket = {
      on: (_event: string, callback: Function) => {
        if (_event === "connect") {
          setTimeout(() => {
            setConnected(true);
            callback();
          }, 500);
        }
        if (_event === "chat-message") {
          // We'll store this callback to simulate incoming messages
          // @ts-ignore
          mockSocket.chatCallback = callback;
        }
      },
      emit: (_event: string, data: any) => {
        if (_event === "send-message") {
          const mockMessage = {
            id: Math.random().toString(36).substring(2, 9),
            sender: address,
            displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
            message: data.message,
            room: data.room,
            timestamp: Date.now(),
          };

          // Simulate receiving our own message after a short delay
          setTimeout(() => {
            // @ts-ignore
            if (mockSocket.chatCallback) {
              // @ts-ignore
              mockSocket.chatCallback(mockMessage);
            }
          }, 200);

          // Simulate receiving a response from another user
          if (data.room === "general") {
            setTimeout(() => {
              const botMessages = [
                "Welcome to Club Frenguin!",
                "How are you doing today?",
                "I love this place!",
                "The weather is nice today.",
                "Have you tried the adult room?",
                "This is so cool!",
                "I'm new here. What about you?",
                "Hello there!",
              ];

              const botMessage = {
                id: Math.random().toString(36).substring(2, 9),
                sender: "0xbot",
                displayName: "Club Bot",
                message:
                  botMessages[Math.floor(Math.random() * botMessages.length)],
                room: data.room,
                timestamp: Date.now(),
              };

              // @ts-ignore
              if (mockSocket.chatCallback) {
                // @ts-ignore
                mockSocket.chatCallback(botMessage);
              }
            }, 2000);
          }
        }
      },
      disconnect: () => {
        setConnected(false);
      },
    };

    // @ts-ignore
    socketRef.current = mockSocket;

    // Connect to mock socket
    // @ts-ignore
    socketRef.current.on("connect", () => {
      console.log("Connected to chat server");
    });

    // Listen for messages
    // @ts-ignore
    socketRef.current.on("chat-message", (message: ChatMessage) => {
      if (message.room === room) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      if (socketRef.current) {
        // @ts-ignore
        socketRef.current.disconnect();
      }
    };
  }, [address, room]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !address || !socketRef.current) return;

    // @ts-ignore
    socketRef.current.emit("send-message", {
      message,
      room,
    });

    setMessage("");
  };

  if (!address) {
    return <div>Please connect your wallet to chat</div>;
  }

  return (
    <div className="flex flex-col h-64 border rounded-lg overflow-hidden">
      <div className="bg-gray-200 px-4 py-2 font-semibold">
        {room === "general" ? "General Chat" : "Adults Only Chat"}
        <span
          className={`ml-2 h-2 w-2 rounded-full inline-block ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
        ></span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 ${msg.sender === address ? "text-right" : ""}`}
          >
            <span className="text-xs text-gray-500">{msg.displayName}:</span>
            <div
              className={`px-3 py-2 rounded-lg inline-block max-w-xs ${
                msg.sender === address
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 focus:outline-none"
          disabled={!connected}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 disabled:bg-gray-300"
          disabled={!connected || !message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
