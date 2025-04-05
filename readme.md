⸻

🌿 Club Frenguin: The Gardenverse

An identity-aware, privacy-preserving social world built onchain.

⸻

🧠 What It Is

Club Frenguin is a 2D, passport-verified social experience where users explore gardens, create personal avatars, and access gated chatrooms based on zero-knowledge passport proofs (via Self Protocol).

It's like Club Penguin meets ZK identity — but safer, permissionless, and onchain.

⸻

🌍 Core Features

1. ZK Identity Verification
	•	Uses Self Protocol to scan passport NFC data and generate a zk-proof
	•	User discloses only what's necessary (e.g. age, nationality, gender)


2. Avatar Creation
	•	After verification, users get a penguin-like avatar
	•	Avatar style (color/accessories) reflects age, gender, etc.

3. ENS Subname Assignment
	•	User gets a free subdomain (e.g., kai.frenguin.eth)
	•	This name ties together identity, chat presence, and garden ownership

4. The Gardenverse
	•	Users move around a 2D garden world built with Phaser.js
	•	Each garden/room is access-controlled by zk-proof criteria:
	•	🌸 Bloom Lounge: Age under 18
	•	🌲 Elder Grove: Age 18+
	•	On access, zk-proof is verified silently, keeping user data private

5. Real-Time Chat
	•	Socket.io powers chat bubbles above avatars
	•	Chat is gated by the same zk-proof criteria as rooms
	•	Messages appear only to users in the same room

⸻

🧱 Sponsors Integrated

Sponsor	Integration
Self Protocol	Passport-based zk identity verification
ENS	Assigns onchain subname (e.g., user.clubfrenguin.eth)


⸻

🛠️ Tech Stack
	•	Frontend: React (Next.js), wagmi, Tailwind
	•	2D World: Phaser.js (game engine for avatar movement and world rendering)
	•	Real-time Chat: Socket.io (for chat bubbles and room-based messaging)
	•	Backend: Node.js + Express or Next.js API Routes
	•	Smart Contracts:
	•	Durin ENS Registrar for subnames
	•	Identity: Self Protocol SDK (@selfxyz/qrcode, @selfxyz/core)


⸻

🚀 User Flow
	1.	Connect wallet
	2.	Scan passport using Self QR
	3.	Generate zk-proof of age, country, OFAC
	4.	Create avatar (based on gender, age)
	5.	Get ENS subname
	6.	Enter 2D Phaser.js world
	7.	Move avatar and chat with others in same room
	8.	Attempt to enter gated rooms — zk proof decides
	9.	Meet frens, explore gardens

⸻

🪴 Optional Expansions
	•	NFT avatars w/ customizable traits
	•	Avatar growth tied to room participation (XP system)
	•	Garden ownership (mint own garden NFT)
	•	Persistent chat history (using ENS + Metal)
	•	Event-based quests (e.g. birthday flower drop via zk DOB)

⸻

🧩 What's Cool
	•	100% privacy-preserving — no central server knows your DOB or passport number
	•	Prevents bots and predators with proof of humanity + age verification
	•	Onchain social without exposing users
	•	Real-time interaction with privacy guardrails
	•	ENS enhance persistence
	•	Expands the idea of identity as access — without KYC or surveillance

⸻

