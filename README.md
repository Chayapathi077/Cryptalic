# Cryptalic — Blockchain-Based Software Licensing & Anti-Piracy System

<img width="2468" height="1936" alt="cryptalic1" src="https://github.com/user-attachments/assets/9698973a-f4b0-4a33-acf5-5fe03423eb16" />


## Project Overview

**What is Cryptalic?**
Cryptalic is a web-based software marketplace where developers can sell their software and buyers can purchase and run it — all powered by blockchain technology and end-to-end encryption.

Think of it like an app store, but instead of Apple or Google controlling everything, the seller and buyer interact directly. The software files are encrypted (locked with a secret code) before they're ever uploaded, so nobody — not even Cryptalic itself — can access the raw files. Only the person who bought the license can unlock and use the software.

---

## How Does It Work?

### For Sellers (People Who Create Software)

<img width="2468" height="1936" alt="cryptalic2" src="https://github.com/user-attachments/assets/9cf82af8-ec66-44dd-a14d-661f32f5bd9d" />


1. **Sign Up & Log In** — A seller creates an account with a username, email, and password. During signup, they're given a unique security phrase (like a secret password made of random words) that helps them recover their account if they ever forget their password.
2. **Upload Software** — The seller uploads their software file (like a `.zip` or `.exe`). Before the file leaves their computer, it gets encrypted (scrambled into unreadable data) right inside their web browser. This means the file is already locked before it ever touches the internet.
3. **File Goes to IPFS** — The encrypted file is then uploaded to IPFS (InterPlanetary File System) via a service called Pinata. IPFS is like a giant, shared hard drive spread across many computers around the world. It's decentralised, meaning no single company owns or controls it.
4. **Listing on the Marketplace** — The seller sets a title, description, price (in POL cryptocurrency), category, license type, and licensing rules (like whether the buyer can only use it on one device).

### For Buyers (People Who Want to Use Software)

<img width="2468" height="1936" alt="cryptalic4" src="https://github.com/user-attachments/assets/7413e0f3-50ce-4c16-aca9-061a5d3d043d" />


1. **Browse & Buy** — The buyer connects their MetaMask wallet (a digital crypto wallet in their browser) and browses the marketplace. When they find software they like, they purchase a license.
2. **Download a License File** — After purchasing, the buyer gets a `.license.json` file. This tiny file contains the information needed to prove they bought the software.

<img width="2468" height="1936" alt="cryptalic5" src="https://github.com/user-attachments/assets/0eb5fd4b-a231-45cc-9796-c1fa68a1deef" />


3. **Run the Software** — The buyer uploads their license file into the "Run Software" page. Cryptalic then:
   * Checks the buyer's wallet address (to make sure they're the one who paid).
   * Checks their device fingerprint (to make sure they're on the right computer, if the seller enabled this rule).

<img width="2468" height="1936" alt="cryptalic6" src="https://github.com/user-attachments/assets/85bb66e5-f204-4975-aa46-a66525c2e2ed" />


If everything checks out, the encrypted file is downloaded from IPFS and decrypted (unlocked) right inside the buyer's browser. The buyer can then view or download the real, usable file.

---

## The Key Idea

The actual software file is never stored unencrypted anywhere on the internet. It's encrypted on the seller's computer, stored encrypted on IPFS, and only decrypted on the buyer's computer after their identity is verified. This is called **end-to-end encryption**.

<img width="2468" height="1936" alt="cryptalic3" src="https://github.com/user-attachments/assets/2a6eb1ff-5e59-4487-96e6-ee3c65df4534" />


---

## Technologies Used

Here's a breakdown of every major technology that powers Cryptalic, explained simply:

### Frontend (What You See)

| Technology | What It Does |
| :--- | :--- |
| **Next.js 14** | The main framework that builds the entire website. It handles both the pages you see (frontend) and the behind-the-scenes logic (backend API routes) in one project. |
| **React** | The library that makes the user interface interactive — buttons, forms, animations, and page updates all happen without reloading the page. |
| **TypeScript** | A version of JavaScript that catches mistakes before they happen, like a spell-checker for code. |
| **Tailwind CSS** | A styling system that lets developers design beautiful interfaces quickly using utility classes instead of writing long CSS files. |
| **Framer Motion** | The animation library that creates the smooth intro sequence (the fire logo crossfading into the box logo, the text sliding in, etc.). |
| **Lucide React** | A collection of beautiful, lightweight icons used throughout the app (the box logo, arrows, settings gear, etc.). |
| **shadcn/ui** | Pre-built, beautifully designed UI components (buttons, modals, dropdowns, tables, switches) that give the app its polished, premium look. |

### Backend (Behind the Scenes)

| Technology | What It Does |
| :--- | :--- |
| **Next.js API Routes** | Serverless functions that handle login, signup, uploading software, managing licenses, and more — all without needing a separate server. |
| **MongoDB** | The database that stores all user accounts, software listings, license records, and settings. It's a NoSQL database, meaning it stores data in flexible, JSON-like documents. |
| **Pinata (IPFS)** | The service that uploads encrypted software files to IPFS (a decentralised file storage network). Files stored on IPFS can't be taken down or tampered with by any single entity. |

### Blockchain & Crypto

| Technology | What It Does |
| :--- | :--- |
| **MetaMask** | A browser extension that acts as a crypto wallet. Buyers connect MetaMask to verify their identity and make payments. |
| **Ethers.js** | A JavaScript library that lets the website talk to the blockchain — connecting wallets, reading addresses, and processing transactions. |
| **Polygon (POL)** | The blockchain network used for payments. Polygon is a "Layer 2" network built on top of Ethereum, meaning transactions are fast and cheap. |

### Security & Encryption

| Technology | What It Does |
| :--- | :--- |
| **Web Crypto API** | The browser's built-in encryption engine. Cryptalic uses it to encrypt files on the seller's device and decrypt them on the buyer's device — all without the data ever being exposed. |
| **AES Encryption** | The specific encryption algorithm used. AES (Advanced Encryption Standard) is the same standard used by governments and banks worldwide. |
| **Device Fingerprinting** | A unique ID generated for each device, ensuring a license can only be used on the buyer's specific computer (if the seller enables this rule). |
| **Security Phrase Recovery** | Instead of traditional "forgot password" emails, users verify their identity using a secret phrase they were given during signup — adding an extra layer of security. |

---

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────┐
│                    USER'S BROWSER                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  React   │  │ MetaMask │  │  Web Crypto API  │   │
│  │   UI     │  │  Wallet  │  │ (Encrypt/Decrypt)│   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │                 │            │
└───────┼──────────────┼─────────────────┼────────────┘
        │              │                 │
        ▼              ▼                 ▼
┌───────────────────────────────────────────────────────┐
│              NEXT.JS SERVER (API Routes)              │
│                                                       │
│  /api/signup  /api/signin  /api/upload  /api/license  │
└───────────────────┬───────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼                       ▼
┌──────────────┐      ┌─────────────────┐
│   Database   │      │  Pinata / IPFS  │
│  (DB Store)  │      │ (File Storage)  │
└──────────────┘      └─────────────────┘
```

## Summary
Cryptalic is a decentralised, encrypted software marketplace. Sellers upload encrypted software, buyers purchase licenses using cryptocurrency, and the software is only unlocked on the buyer's verified device. The entire system is designed so that no middleman ever has access to the raw software files — making it secure, private, and trustworthy.

It's built with modern web technologies (Next.js, React, TypeScript), secured with military-grade encryption (AES via Web Crypto API), powered by blockchain payments (Polygon via MetaMask), and stores files on a decentralised network (IPFS via Pinata).

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites
* Node.js (v18 or later)
* npm or yarn
* A Database setup (e.g., MongoDB/Turso) based on your backend configuration.
* A Pinata account to manage IPFS uploads.
* MetaMask browser extension for blockchain interactions.

### Installation & Setup

1. **Clone the repository:**
```bash
   git clone [https://github.com/Chayapathi077/blockchain-based-software-licensing-and-piracy-prevention-system.git](https://github.com/Chayapathi077/blockchain-based-software-licensing-and-piracy-prevention-system.git)
   cd blockchain-based-software-licensing-and-piracy-prevention-system
   ```

2. **Install dependencies:**
```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root of your project and add the necessary variables for your database, Pinata, Polygon network, and Smart Contracts.
   
```env
   # Database Configuration
   DATABASE_URL="your_database_connection_string"
   
   # Pinata API Keys (for uploading files to IPFS)
   PINATA_API_KEY="your_pinata_api_key"
   PINATA_SECRET_API_KEY="your_pinata_secret_key"
   
   # Polygon Amoy Testnet RPC URL
   NEXT_PUBLIC_AMOY_RPC_URL="your_amoy_rpc_url"
   
   # Smart Contract Details
   NEXT_PUBLIC_SOFTWARE_LICENSE_CONTRACT_ADDRESS="your_deployed_contract_address"
   NEXT_PUBLIC_SELLER_PRIVATE_KEY="your_wallet_private_key"
   ```

4. **Run the development server:**
```bash
   npm run dev
   ```
   Open `http://localhost:3000` with your browser to see the result.

---

## Smart Contract
The Solidity smart contract (`SoftwareLicense.sol`) is a standard ERC-721 (NFT) contract with extra functions to `mintLicense`, `revokeLicense`, and set a `tokenURI`. You can deploy an ERC-721 template to the Polygon Amoy testnet using tools like Remix or Hardhat.

---

## Deployment
This application is optimised for deployment on Vercel (the creators of Next.js).

1. Push your code to GitHub (if you haven't already).
2. Go to [Vercel.com](https://vercel.com) and log in.
3. Click **Add New...** > **Project**.
4. Import your GitHub repository.
5. In the Environment Variables section, copy and paste all the variables from your local `.env` file.
6. Click **Deploy**. Vercel will automatically build and deploy your application.

---

## 📄 License
© 2026 Cryptalic. All rights reserved.
