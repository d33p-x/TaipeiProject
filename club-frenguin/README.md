# Club Frenguin

A fun age-verified virtual world built for the ETH Global Hackathon. This project allows users to connect their wallet, verify their age using Self Protocol, and enter a virtual world with different rooms based on age verification.

## Features

- Connect wallet via WalletConnect
- Age verification with Self Protocol
- Simple avatar creation based on wallet address
- 2D world with basic movement in Phaser.js
- Two chat rooms: General and Adults Only (18+)
- Token reward UI when entering age-restricted areas

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/club-frenguin.git
cd club-frenguin
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.local` to `.env.local`
- Get a WalletConnect project ID from [WalletConnect Cloud](https://cloud.walletconnect.com) and add it to `.env.local`

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Connect your wallet using the Connect Wallet button
2. Verify your age using the Self Protocol QR code scanner
3. After verification, you'll be able to see your avatar and enter the virtual world
4. Use arrow keys to move around
5. Chat with others in the appropriate rooms
6. Adults-only areas are restricted to verified 18+ users

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Self Protocol for age verification
- WalletConnect / Wagmi for wallet connection
- Phaser.js for 2D game world
- Socket.io for chat functionality (simulated in MLP)

## Development Roadmap

- [ ] ENS subdomain assignment
- [ ] Actual token rewards
- [ ] Persistent verification using JWTs
- [ ] Additional verification types (gender, nationality)
- [ ] Avatar customization
- [ ] Multiple themed rooms

## License

MIT
