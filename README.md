# 💎 DiamondScope — EIP-2535 Diamond Inspector

> **Decentralized Observability, Formal Introspection, and Security Diagnostics Protocol for EIP-2535 Diamond Contracts on Botchain Mainnet & Testnet.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Mainnet](https://img.shields.io/badge/Mainnet-Botchain%20(677)-059669)](https://scan.botchain.ai/)
[![Standard](https://img.shields.io/badge/EIP--2535-Diamond%20Standard-emerald)](https://eips.ethereum.org/EIPS/eip-2535)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Gas](https://img.shields.io/badge/Protocol%20Fee-Gas%20Only%20(0%20Fee)-10b981)](#-economic-model-strictly-gas-fee-only)

---

## 🌟 Overview

**DiamondScope** is an on-chain inspector and diagnostic tool for [EIP-2535 Multi-Facet Diamond contracts](https://eips.ethereum.org/EIPS/eip-2535) deployed natively on **Botchain Mainnet** (and Botchain Testnet). 

Diamonds break down monolithic contracts into multiple stateless logic contracts called **Facets**. DiamondScope provides:
- **Interactive Visual Architecture Topology**: Maps out the Diamond core and all connected facets in a modern White & Green interface.
- **Function Selector Introspection**: Decodes 4-byte selectors into human-readable function signatures using an integrated signature database.
- **Automated Security & Health Diagnostics**: Identifies selector collisions, zero-address targets, empty facets, and missing standard loupe/cut interfaces.
- **On-Chain Inspection Ledger (`DiamondScope.sol`)**: Submits audits directly to an immutable on-chain registry via **strictly gas-fee-only** transactions (zero protocol fees).

📄 Read the full technical specification in [**WHITEPAPER.md**](WHITEPAPER.md).

---

## 🚀 Live Deployments on Botchain Mainnet (Chain ID: `677`)

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **`DiamondScope.sol` Registry** | `0x63fE2E161E2f00bFf5C1Df8Ff78807A7a7E0E380` | [View on BotchainScan](https://scan.botchain.ai/address/0x63fE2E161E2f00bFf5C1Df8Ff78807A7a7E0E380) |
| **Reference EIP-2535 Diamond** | `0xCEe8b58FcD03703ef89F07C749F3AE26439ad223` | [View on BotchainScan](https://scan.botchain.ai/address/0xCEe8b58FcD03703ef89F07C749F3AE26439ad223) |
| ├── *DiamondCutFacet* | `0xF28FDD042AdfC422aE53A77A397a78A2B284857B` | [View on BotchainScan](https://scan.botchain.ai/address/0xF28FDD042AdfC422aE53A77A397a78A2B284857B) |
| ├── *DiamondLoupeFacet* | `0xA4a706bA8d936B28E6Dc56f69c6A91174AEeF33f` | [View on BotchainScan](https://scan.botchain.ai/address/0xA4a706bA8d936B28E6Dc56f69c6A91174AEeF33f) |
| ├── *OwnershipFacet* | `0x2C2691A079BB2e672Db493972C792D9a233e3118` | [View on BotchainScan](https://scan.botchain.ai/address/0x2C2691A079BB2e672Db493972C792D9a233e3118) |
| └── *SampleVaultFacet* | `0xef58042274194aC23e1BE02115CD086119671eDD` | [View on BotchainScan](https://scan.botchain.ai/address/0xef58042274194aC23e1BE02115CD086119671eDD) |

### Testnet Deployments (Chain ID: `968`)
- **DiamondScope Registry**: [`0x7DF571308dbb62a385064B8115F72497CfcC5f34`](https://scan.bohr.life/address/0x7DF571308dbb62a385064B8115F72497CfcC5f34)
- **Reference Diamond**: [`0x4687550cE4CdCAd54F2b7E0eeDDaa4A49f7fB98E`](https://scan.bohr.life/address/0x4687550cE4CdCAd54F2b7E0eeDDaa4A49f7fB98E)

---

## ⚡ Key Features

1. **Connect Wallet with Reown AppKit**:
   - Modern Web3 connection powered by `@reown/appkit` and `@reown/appkit-adapter-wagmi`.
   - Native support for **Botchain Mainnet (677)** and Testnet (968).
2. **On-Chain Inspection Transaction**:
   - Clicking **"Inspect Diamond"** signs an on-chain verification transaction to `DiamondScope.sol`:
     ```solidity
     requestDiamondCheck(address targetDiamond)
     ```
   - Automatically publishes the verified results:
     ```solidity
     publishResult(uint256 requestId, uint256 facetCount, uint256 selectorCount, string summary)
     ```
3. **EIP-2535 Loupe Introspection**:
   - Calls `facets()`, `facetFunctionSelectors()`, `facetAddresses()`, and `facetAddress()`.
   - Fallback cascading if custom loupe returns are used.
4. **Visual Architecture Graph**:
   - Emerald and White UI showcasing the Diamond proxy hub and selector routes to each facet.
   - Categorized by facet type: Loupe, Cut, Ownership/Access, and Business logic.
5. **Security Diagnostics**:
   - 🛡️ Zero-address target detection (`address(0)`)
   - 🛡️ Selector collision / duplicate routing analysis
   - 🛡️ ERC-165 & EIP-2535 Loupe compliance check (`0x48e2b093`)
   - 🛡️ Upgradeability & DiamondCut check (`0x1f931c1c`)
   - 🛡️ Access control & ownership presence audit
   - 🛡️ Empty facet alert (0 selectors attached)

---

## ⛽ Economic Model: Strictly Gas-Fee-Only

Every transaction interacting with `DiamondScope.sol` is designed strictly with **zero protocol fees**:
- Functions are strictly non-payable (`msg.value == 0`).
- No tax, cut, or protocol fee is charged.
- Users exclusively pay the standard EVM gas fee in native `BOT` tokens.

---

## 📂 Project Structure

```
diamondscope/
├── contracts/
│   ├── DiamondScope.sol            # On-chain inspection registry (gas fee only)
│   ├── interfaces/
│   │   ├── IDiamondLoupe.sol       # EIP-2535 Loupe interface
│   │   ├── IDiamondCut.sol         # EIP-2535 Cut interface
│   │   └── IERC165.sol             # ERC-165 interface
│   └── sample-diamond/             # Live sample Diamond implementation
│       ├── Diamond.sol
│       ├── libraries/LibDiamond.sol
│       └── facets/
│           ├── DiamondCutFacet.sol
│           ├── DiamondLoupeFacet.sol
│           ├── OwnershipFacet.sol
│           └── SampleVaultFacet.sol
├── scripts/
│   ├── deploy.cjs                  # Deploys DiamondScope.sol (Mainnet & Testnet)
│   └── deploySampleDiamond.cjs     # Deploys Sample Diamond (Mainnet & Testnet)
├── src/
│   ├── components/
│   │   ├── Header.tsx              # App header with wallet connect
│   │   ├── DiamondInspector.tsx    # Inspection engine & on-chain tx trigger
│   │   ├── ArchitectureGraph.tsx   # Interactive visual node graph
│   │   ├── FacetList.tsx           # Searchable facet & function directory
│   │   ├── InspectionWarnings.tsx  # Diagnostics & security checks
│   │   ├── RequestHistory.tsx      # On-chain audit ledger feed
│   │   └── SubmitInspectionModal.tsx # Standalone inspection submission modal
│   ├── config/wagmi.ts             # Botchain Mainnet (677) & Reown AppKit setup
│   ├── utils/explorer.ts           # Dynamic explorer links helper
│   ├── utils/selectors.ts          # Selector signature database
│   └── App.tsx                     # Main layout
├── .env.example                    # Template for environment variables
├── hardhat.config.cjs              # Hardhat configuration for Botchain
├── vite.config.ts                  # Vite config with REOWN_ID server proxy
├── WHITEPAPER.md                   # Protocol whitepaper
└── README.md
```

---

## 🛠 Quick Start

### 1. Installation
```bash
git clone https://github.com/webtrovert0x/diamondscope.git
cd diamondscope
npm install
```

### 2. Configure `.env`
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your private key and Reown project ID:
```ini
PRIVATE_KEY=your_private_key_here
REOWN_ID=your_reown_project_id_here
CHAIN_ID=677
RPC_URL=https://rpc.botchain.ai
EXPLORER_URL=https://scan.botchain.ai/
```
> **Security Note**: Never commit your `.env` file. It is excluded via `.gitignore`.

### 3. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### 4. Deploying Smart Contracts
```bash
# 1. Compile contracts
npm run compile

# 2. Deploy DiamondScope.sol registry to Mainnet
npx hardhat run scripts/deploy.cjs --network mainnet

# 3. Deploy Reference Sample Diamond to Mainnet
npx hardhat run scripts/deploySampleDiamond.cjs --network mainnet
```

---

## 🌐 Network Specifications

- **Production Network**: Botchain Mainnet
- **Chain ID**: `677`
- **RPC URL**: `https://rpc.botchain.ai`
- **Native Token**: `BOT`
- **Block Explorer**: [https://scan.botchain.ai/](https://scan.botchain.ai/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
