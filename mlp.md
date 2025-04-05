✅ Your Hackathon MLP: "Club Frenguin" (working name)

🧩 Core Flow (must-have)
	1.	User connects wallet
	2.	Scans passport via Self Protocol
	3.	Creates an avatar (gender/age-based emoji or sprite)
	4.	Gets a free ENS subname (kai.zkclub.eth)
	5.	Enters a 2D world with Phaser.js (basic movement)
	6.	Can chat with others in the same room (Socket.io)
	7.	Can only enter rooms they qualify for
	•	"Over 18 only" lounge
	•	"Under 18 chat"
	•	"Global chatroom" excludes e.g. North Korea
	8.	Earns a token reward (via Metal) after joining a room

⸻

🔥 Bonus Features (if time allows)
	•	🎨 Customize avatar with accessories (token-gated or Metal-purchased)
	•	🧱 ENS Profile support (show avatar, bio from ENS)
	•	🧠 Saved profile page (show verified data + ENS name + avatar)
	•	🌍 Interactive map with clickable room icons
	•	💬 Persistent chat history between sessions
	•	📜 Proof viewer (see what was verified via Self)

⸻

🛠️ Tools & Stack (time-friendly)

Feature	Tool / Package	Notes
Frontend	Next.js	Fast setup with API routes
2D World	Phaser.js	Simple movement and room rendering
Chat	Socket.io	Real-time chat bubbles
Auth	wagmi + viem	Connect wallet & resolve ENS
Self Protocol	@selfxyz/qrcode + @selfxyz/core	Already documented, can use example
ENS Subnames	Use your .eth + NameWrapper	Pre-mint or wrap dynamically
Token Drop	Metal SDK / API	Just call token mint/send via backend
Server	Node.js/Express or Next.js API routes	Handle verification and chat


⸻

⏳ 15-Hour Timeline (Streamlined MVP)

🔹 Hours 1–3: Setup & Identity
	•	Set up Next.js project with wallet connect (wagmi)
	•	Integrate Self QR for basic passport verification
	•	Focus on extracting only essential data (age, nationality, gender)

🔹 Hours 4–6: Simplified Avatar & ENS
	•	Create basic avatar using pre-made emoji/sprites (no customization)
	•	Implement basic ENS subname assignment
	•	Simple profile display with avatar and ENS name

🔹 Hours 7–10: Basic World with Phaser.js
	•	Setup Phaser.js with single garden environment
	•	Implement basic avatar movement controls
	•	Create 2-3 simple room areas with boundaries
	•	Add minimal ZK gating (age check only)

🔹 Hours 11–13: Essential Chat & Rewards
	•	Basic Socket.io implementation for room-specific chat
	•	Simple text bubbles above avatars
	•	Implement token drop via Metal API (simplified)

🔹 Hours 14–15: Polish & Demo Prep
	•	Fix critical bugs
	•	Create simple landing page explaining the concept
	•	Prepare concise demo script highlighting core features

⸻

🏁 Revised Minimum Working Demo
	•	User connects wallet
	•	Self QR flow provides basic verification
	•	Simple avatar appears with ENS name
	•	Basic movement in a single Phaser.js environment
	•	Text-only chat functionality
	•	One age-gated room with pass/fail
	•	Basic token reward on successful entry
	•	Documentation of what features would be added with more time

⸻

💡 Features to Implement if Time Permits (Priority Order)
	1.	Additional ZK gating options (country checks)
	2.	Avatar customization
	3.	Multiple themed garden rooms
	4.	Enhanced chat features
	5.	Profile page with verification details
	6.	Persistent data between sessions
