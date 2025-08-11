Letcoin (LEC) Presale Project
============================

This bundle contains a ready-to-deploy presale project for Letcoin (LEC) configured with your inputs.

Key parameters:
- Token name: Letcoin (LEC)
- Total supply: 1,000,000,000 LEC
- Price: 56,000 LEC per 1 BNB
- Soft cap: 0 BNB (open)
- Hard cap: 5,000,000 BNB
- Duration: 30 days (starts 30s after deploy by default)
- Network target: BSC (Binance Smart Chain)
- Funds receiver (multisig/wallet): 0x5fAE5Cca396C9A8e1F2a9bfCaBd72E9eF2530613

What's included:
- contracts/Letcoin.sol
- contracts/Presale.sol
- scripts/deploy.js (deploy token, deploy presale, transfer tokens to presale)
- frontend/ (Next.js simple UI)

IMPORTANT SECURITY & LEGAL NOTES
- DO NOT deploy to mainnet without a professional audit.
- Replace fundsReceiver with a multisig (Gnosis Safe recommended) for safety.
- Never commit private keys. Use environment variables for deployer keys.
- Test thoroughly on BSC Testnet before mainnet.
- Consult a lawyer regarding token sale regulations in your jurisdiction.

Quick deploy (Testnet):
1) Install dependencies:
   npm install
   cd frontend && npm install

2) Create .env in project root:
   DEPLOYER_PK=your_private_key_without_0x
   MULTISIG_ADDRESS=0x5fAE5Cca396C9A8e1F2a9bfCaBd72E9eF2530613

3) Compile & deploy to BSC testnet:
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network bscTestnet

4) Run frontend locally:
   cd frontend
   npm run dev
   Open http://localhost:3000 and paste the deployed presale contract address.

If you want, I can:
- Prepare a GitHub repo with these files (you'll need to authorize and provide repo name), or
- Guide you step-by-step to deploy to Vercel and connect the contract address.

