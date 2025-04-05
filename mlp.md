✅ Your Hackathon MLP: "Club Frenguin" (working name)

🧩 Core Flow (must-have)
	1.	User connects wallet
	2.	Scans passport via Self Protocol for age verification
	3.	Creates a simple avatar (emoji or sprite)
	4.	Gets wallet or ENS name displayed above avatar
	5.	Enters a 2D world with Phaser.js (basic movement)
	6.	Can chat with others in the same room (Socket.io)
	7.	Age-gated access:
	•	"Over 18 only" lounge
	•	"General chat" for everyone
	8.	UI confirmation of token reward after joining a room

⸻

⏳ 12-Hour Implementation Plan

🔹 Hours 1–3: Setup & Identity
	•	Set up Next.js project with wallet connect (wagmi)
	•	Integrate Self QR for basic age verification
	•	Store verification results in session storage (no blockchain needed for MVP)

🔹 Hours 4–6: Avatar & World
	•	Create basic avatar using pre-made emoji/sprites
	•	Display wallet address or ENS name above avatar
	•	Setup Phaser.js with simple garden environment
	•	Implement basic movement controls

🔹 Hours 7–9: Rooms & Access Control
	•	Create 2 room areas: "General" and "18+ Lounge"
	•	Implement age verification check from session storage
	•	Add visual feedback when access is denied (age restriction)
	•	Create simple UI for mock token reward

🔹 Hours 10–12: Chat & Polish
	•	Basic Socket.io implementation for room-specific chat
	•	Simple text bubbles above avatars
	•	Fix critical bugs and prepare demo
	•	Document future enhancements (ENS, blockchain integration)

⸻

🏁 Minimum Working Demo
	•	User connects wallet
	•	Self QR flow verifies age (18+)
	•	Simple avatar appears with wallet/ENS name
	•	Basic movement in Phaser.js environment
	•	Text chat functionality in appropriate rooms
	•	Age-gated access to 18+ room based on verification
	•	Mock token reward UI on successful entry

⸻

💡 Post-Hackathon Enhancements
	1.	ENS subdomain assignment
	2.	Actual token rewards via Metal
	3.	Persistent verification using JWTs or blockchain
	4.	Additional verification types (gender, nationality)
	5.	Avatar customization
	6.	Multiple themed rooms