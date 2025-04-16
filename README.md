# TruthNode

A decentralized platform for publishing and verifying news articles using blockchain technology and IPFS for content storage.

## Features

- 📰 Decentralized article publishing
- 🔍 Article verification system
- 🔐 Blockchain-based authentication
- 📦 IPFS-based content storage
- 🌐 Web3 integration
- 🔄 Real-time updates
- 👥 Community-driven verification

## Tech Stack

- **Frontend:**
  - React
  - TypeScript
  - Tailwind CSS
  - Vite
  - Web3.js
  - IPFS

- **Backend:**
  - Node.js
  - Express
  - PostgreSQL
  - Drizzle ORM
  - WebSocket

- **Blockchain:**
  - Ethereum
  - Smart Contracts
  - Ethers.js

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- MetaMask or similar Web3 wallet
- Pinata account for IPFS
- Infura account for Ethereum node access

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/decentralized-truth.git
cd decentralized-truth
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration values.

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Pinata API Configuration
VITE_PINATA_API_KEY=your_pinata_api_key_here
VITE_PINATA_API_SECRET=your_pinata_api_secret_here
VITE_PINATA_JWT=your_pinata_jwt_here

# Ethereum Configuration
VITE_ETHEREUM_PROVIDER=your_ethereum_provider_url
VITE_ETHEREUM_NETWORK=sepolia
VITE_TOKEN_CONTRACT_ADDRESS=your_contract_address

# Server Configuration
VITE_PORT=5173
VITE_HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

## Project Structure

```
DecentralizedTruth/
├── client/           # Frontend React application
│   ├── src/         # Source files
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # Custom hooks
│   │   ├── lib/        # Utility functions
│   │   └── types/      # TypeScript types
├── server/          # Backend Express server
│   ├── routes/      # API routes
│   ├── middleware/  # Express middleware
│   └── models/      # Database models
├── shared/          # Shared code between client and server
└── contracts/       # Smart contracts
```

## Development

### Running the Development Server

```bash
npm run dev
```

This will start both the frontend and backend servers.

### Building for Production

```bash
npm run build
```

### Database Migrations

```bash
npm run db:push
```


## Security

- All sensitive data should be stored in environment variables
- Never commit `.env` files
- Follow security best practices for smart contracts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ethereum](https://ethereum.org/)
- [IPFS](https://ipfs.io/)
- [Pinata](https://www.pinata.cloud/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/) 
