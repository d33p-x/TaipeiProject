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
	•	User discloses only what's necessary (e.g. age, nationality, OFAC check)
	•	Proof is verified offchain (via backend) or onchain (via contract)

2. Avatar Creation
	•	After verification, users get a penguin-like avatar
	•	Avatar style (color/accessories) reflects age, gender, etc.
	•	Optionally minted as a soulbound NFT (stored onchain, unique to user)

3. ENS Subname Assignment
	•	User gets a free subdomain (e.g., kai.clubfrenguin.eth)
	•	This name ties together identity, chat presence, and garden ownership

4. The Gardenverse
	•	Users move around a 2D garden world built with Phaser.js
	•	Each garden/room is access-controlled by zk-proof criteria:
	•	🌸 Bloom Lounge: Age under 18
	•	🌲 Elder Grove: Age 18+
	•	🪷 Zen Pond: Passed OFAC check
	•	On access, zk-proof is verified silently, keeping user data private

5. Real-Time Chat
	•	Socket.io powers chat bubbles above avatars
	•	Chat is gated by the same zk-proof criteria as rooms
	•	Messages appear only to users in the same room

6. Token Rewards (via Metal)
	•	Users earn a token like $SEED when entering spaces or interacting
	•	Tokens are created via Metal's token minting API (no wallet UX required)

⸻

🧱 Sponsors Integrated

Sponsor	Integration
Self Protocol	Passport-based zk identity verification
ENS	Assigns onchain subname (e.g., user.clubfrenguin.eth)
Metal	Mints & sends onchain token rewards ($SEED or similar)

Optional:
	•	Could use ENS Profile to display user avatar & metadata
	•	Could deploy on Celo or Polygon for gasless interaction

⸻

🛠️ Tech Stack
	•	Frontend: React (Next.js), wagmi, Tailwind
	•	2D World: Phaser.js (game engine for avatar movement and world rendering)
	•	Real-time Chat: Socket.io (for chat bubbles and room-based messaging)
	•	Backend: Node.js + Express or Next.js API Routes
	•	Smart Contracts:
	•	Minimal ERC721 (optional NFT avatars)
	•	ENS NameWrapper for subnames
	•	Identity: Self Protocol SDK (@selfxyz/qrcode, @selfxyz/core)
	•	ENS: ethers.js / viem + ENS libraries
	•	Token: Metal SDK or custom backend API call to mint tokens

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
	9.	Earn tokens, meet frens, explore gardens

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
	•	ENS and Metal enhance persistence and rewards
	•	Expands the idea of identity as access — without KYC or surveillance

⸻

