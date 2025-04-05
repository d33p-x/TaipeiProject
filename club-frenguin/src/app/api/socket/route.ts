// This file simulates a Socket.IO server using Next.js Server Actions
// since actual WebSocket connections aren't possible in standard API routes

import { NextRequest, NextResponse } from "next/server";

// In-memory store for connected users and their positions
type UserData = {
  id: string;
  position: { x: number; y: number };
  room: string;
  character: string;
  messages: Array<{ text: string; timestamp: number }>;
  lastUpdate: number;
};

// Global (server-side) state for users
// WARNING: This will be reset when the serverless function is redeployed or when it goes idle
// IMPORTANT: This is why multiplayer may appear to work and then stop working
const connectedUsers: Record<string, UserData> = {};

// Helper to ensure consistent room name formats
function normalizeRoomName(room: string): string {
  if (room === "adults-only") return "adult";
  if (room === "kids-only") return "kids";
  return room;
}

// Simulate broadcasting with polling
export async function GET(request: NextRequest) {
  // Get the user ID from the request URL search params
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  let room = searchParams.get("room") || "general";

  // Normalize room name for consistency
  room = normalizeRoomName(room);

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  // For debugging: log details about the request
  console.log(
    `GET request - User ID: ${userId.substring(0, 8)}, Room: ${room}`
  );
  console.log(`Total connected users: ${Object.keys(connectedUsers).length}`);

  // Make sure the requesting user is considered active by updating their timestamp
  if (connectedUsers[userId]) {
    connectedUsers[userId].lastUpdate = Date.now();
  } else {
    // If this user isn't known yet, add them to the state with default values
    // This helps ensure that users can see each other even if one connects slightly later
    console.log(
      `Creating new user record for ${userId.substring(
        0,
        8
      )} during GET request`
    );
    connectedUsers[userId] = {
      id: userId,
      position: { x: 400, y: 300 },
      room: room,
      character: "playerMale",
      messages: [],
      lastUpdate: Date.now(),
    };
  }

  // List all connected users and their rooms for debugging
  const userRooms = Object.values(connectedUsers).map(
    (u) => `${u.id.substring(0, 8)} in ${u.room}`
  );
  console.log(`Active users: ${userRooms.join(", ")}`);

  // Get all users' data (except the requesting user)
  // Intentionally NOT filtering by room to help debug room mismatches
  const allOtherUsers = Object.values(connectedUsers).filter(
    (user) => user.id !== userId
  );

  // Filter by room for the actual response
  const usersInRoom = allOtherUsers.filter((user) => user.room === room);

  console.log(
    `Found ${usersInRoom.length} other users in room "${room}" (out of ${allOtherUsers.length} total)`
  );
  if (usersInRoom.length > 0) {
    console.log(
      `User IDs in room: ${usersInRoom
        .map((u) => u.id.substring(0, 8))
        .join(", ")}`
    );
  }

  if (allOtherUsers.length > 0 && usersInRoom.length === 0) {
    // This suggests a room mismatch - all other users are in different rooms
    console.log(
      `WARNING: Found ${allOtherUsers.length} other users but none in room "${room}"!`
    );
    console.log(
      `Other users are in rooms: ${allOtherUsers
        .map((u) => `${u.id.substring(0, 8)} in "${u.room}"`)
        .join(", ")}`
    );
  }

  return NextResponse.json({
    users: usersInRoom,
    allUsers: allOtherUsers.map((u) => ({
      id: u.id.substring(0, 8),
      room: u.room,
    })),
    debug: {
      totalUsers: Object.keys(connectedUsers).length,
      roomRequested: room,
      usersInRequestedRoom: usersInRoom.length,
      allUsersCount: allOtherUsers.length,
      allUsers: Object.keys(connectedUsers).map((id) => ({
        id: id.substring(0, 8),
        room: connectedUsers[id].room,
        lastUpdate: Date.now() - connectedUsers[id].lastUpdate,
      })),
    },
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { userId, position, room: rawRoom, character, message } = data;

  // Normalize room name
  const room = rawRoom ? normalizeRoomName(rawRoom) : "general";

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  // For debugging: log the POST action
  console.log(
    `POST request - User ID: ${userId.substring(0, 8)}, Room: ${
      room || "not specified"
    }`
  );

  // Create or update user
  if (!connectedUsers[userId]) {
    // New user connecting
    connectedUsers[userId] = {
      id: userId,
      position: position || { x: 400, y: 300 },
      room: room,
      character: character || "default",
      messages: [],
      lastUpdate: Date.now(),
    };
    console.log(
      `New user ${userId.substring(0, 8)} connected in room "${room}"`
    );
  } else {
    // Update existing user
    if (position) {
      connectedUsers[userId].position = position;
    }

    if (room && room !== connectedUsers[userId].room) {
      console.log(
        `User ${userId.substring(0, 8)} moved from room "${
          connectedUsers[userId].room
        }" to "${room}"`
      );
      connectedUsers[userId].room = room;
    }

    if (message) {
      console.log(`User ${userId.substring(0, 8)} sent message: "${message}"`);
      connectedUsers[userId].messages.push({
        text: message,
        timestamp: Date.now(),
      });

      // Keep only the last 10 messages
      if (connectedUsers[userId].messages.length > 10) {
        connectedUsers[userId].messages.shift();
      }
    }

    // Always update the timestamp when any interaction happens
    connectedUsers[userId].lastUpdate = Date.now();

    // If character was provided, update it
    if (character) {
      connectedUsers[userId].character = character;
    }
  }

  // Clean up inactive users (more than 5 minutes without updates)
  // Extended from 60 seconds to 5 minutes to be more forgiving
  const now = Date.now();
  Object.keys(connectedUsers).forEach((id) => {
    if (now - connectedUsers[id].lastUpdate > 300000) {
      // 5 minutes
      console.log(`Removing inactive user ${id.substring(0, 8)}`);
      delete connectedUsers[id];
    }
  });

  // Calculate how many users are in the same room
  const usersInSameRoom = Object.values(connectedUsers).filter(
    (user) => user.room === room && user.id !== userId
  ).length;

  return NextResponse.json({
    success: true,
    usersCount: Object.keys(connectedUsers).length,
    usersInRoom: usersInSameRoom,
    currentRoom: room,
    yourId: userId.substring(0, 8),
  });
}
