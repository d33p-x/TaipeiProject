# Club Frenguin: The Gardenverse

An identity-aware, privacy-preserving social world built onchain.

## Overview

Club Frenguin is a 2D, passport-verified social experience where users explore gardens, create personal avatars, and access gated chatrooms based on zero-knowledge passport proofs (via Self Protocol).

It's like Club Penguin meets ZK identity — but safer, permissionless, and onchain.

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### Deployment

This project can be easily deployed to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# For production deployment
vercel --prod
```

## Technology Stack

- **Frontend**: React (Next.js), wagmi, Tailwind
- **2D World**: Phaser.js
- **Real-time Chat**: Socket.io
- **Identity**: Self Protocol for passport verification
- **Blockchain**: ENS for subdomains, Metal for tokens

## Features

- ZK Identity Verification
- Avatar Creation
- ENS Subname Assignment
- 2D Gardenverse with age-gated rooms
- Real-time chat
- Token rewards

## License

MIT
