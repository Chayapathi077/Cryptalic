# 🏗️ BLUEPRINT: Cryptalic

## 📌 Project Identity
**Type:** Web3 / Cybersecurity Marketplace  
**Core Mechanism:** End-to-end client-side encryption paired with NFT-based software licensing.

## 🧱 Tech Stack Architecture
* **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
* **Backend:** Next.js API Routes (Serverless), MongoDB
* **Web3 & Crypto:** Ethers.js, MetaMask, Polygon (POL), Solidity (ERC-721)
* **Storage:** Pinata / IPFS (Decentralised Storage)
* **Security:** Web Crypto API (AES Encryption), Device Fingerprinting

## 🔄 Core System Flow
1. **Upload:** File selected ➔ Encrypted via Web Crypto API (Browser) ➔ Scrambled BLOB sent to IPFS via Pinata.
2. **Purchase:** Buyer connects MetaMask ➔ Pays in POL ➔ Smart contract mints `.license.json` token.
3. **Execution:** Buyer uploads license ➔ App verifies wallet address & device ID ➔ Fetches from IPFS ➔ Decrypts locally in browser ➔ Prompts native download.

## 🗄️ Primary Data Entities
* **User:** `_id`, `walletAddress`, `securityPhraseHash`
* **Software:** `_id`, `sellerId`, `ipfsHash`, `price`, `encryptionKeyHash`
* **License:** `tokenId`, `buyerAddress`, `softwareId`, `deviceFingerprint`
