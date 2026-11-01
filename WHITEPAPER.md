# DiamondScope: Formal Observability, Architecture Mapping, and Diagnostic Protocol for EIP-2535 Diamond Contracts

**Whitepaper v1.0**  
**Network**: Botchain Testnet (Chain ID: `968`)  
**Native Currency**: BOT  
**Protocol Core**: [`0x7DF571308dbb62a385064B8115F72497CfcC5f34`](https://scan.bohr.life/address/0x7DF571308dbb62a385064B8115F72497CfcC5f34)  
**Date**: November 2026  

---

## 1. Abstract

The Ethereum Improvement Proposal 2535 (EIP-2535), colloquially known as the **Diamond Standard**, represents a cornerstone advancement in smart contract modularity. By overcoming the Spurious Dragon 24.576 KB contract code limit (EIP-170) through multi-facet delegatecall routing, diamonds enable complex enterprise, gaming, and decentralized finance (DeFi) architectures to operate under a singular unified contract address. 

However, this modular flexibility introduces severe opacity: as diamonds accumulate dozens of facets and hundreds of functions, tracking dynamic routing tables, identifying selector collisions, confirming active upgradeability vectors, and verifying standard compliance becomes increasingly difficult.

**DiamondScope** is a decentralized inspection, formal introspection, and diagnostic protocol engineered for EIP-2535 Diamonds on the **Botchain Testnet**. DiamondScope provides real-time facet mapping, 4-byte selector decoding, automated security diagnostics, and an immutable on-chain audit ledger. Operating strictly on a **gas-fee-only economic model** (zero protocol fees, zero value transfers), DiamondScope democratizes high-fidelity diamond observability for developers, auditors, and end-users.

---

## 2. The Diamond Problem: The Need for Observability

### 2.1 The Code Size Bottleneck
Monolithic smart contract architectures are bounded by the 24.576 KB EVM limit. While standard proxy patterns (such as ERC-1967 Transparent Proxies or UUPS) allow upgradeability, they still route all function calls to a single implementation contract, merely postponing the size bottleneck.

### 2.2 The Multi-Facet Solution
EIP-2535 resolves this by introducing multiple logic contracts—known as **Facets**—that share the same contract storage space via `delegatecall`. The core Diamond proxy contract maintains a selector-to-facet routing table:

$$\text{Selector} \in \mathbb{B}^4 \xrightarrow{\quad\text{lookup}\quad} \text{Facet Address} \in \mathbb{A}$$

```
                           +------------------------+
                           |     Diamond Proxy      |
                           |   (Storage & Balances) |
                           +-----------+------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
    (delegatecall)               (delegatecall)               (delegatecall)
          v                            v                            v
+--------------------+       +--------------------+       +--------------------+
|  DiamondCutFacet   |       |  DiamondLoupeFacet |       |  Business Logic    |
| (Upgrade Registry) |       |  (Introspection)   |       |  (Vaults, DEX, etc)|
+--------------------+       +--------------------+       +--------------------+
```

### 2.3 The Observability Deficit
Despite its elegance, the Diamond Standard introduces critical failure modes if not properly monitored:
1. **Selector Hijacking & Shadowing**: A new facet cut can accidentally override an existing selector, redirecting user funds or critical permissions.
2. **Selector Collisions**: Duplicate selector registrations can cause nondeterministic execution.
3. **Ghost / Empty Facets**: Facet addresses registered in the diamond that contain zero active selectors, bloating state.
4. **Zero-Address Poisoning**: Routing entries pointing to `address(0)` resulting in unconditional reverts.
5. **Opaque Upgradeability**: Users and auditors cannot easily discern whether a diamond is immutable or subject to unilateral admin cuts.

---

## 3. Protocol Architecture

DiamondScope addresses these challenges through a three-layer architecture:

```
[ User / Auditor / DApp ]
            |
            v
+-----------------------------------------------------------+
|               DiamondScope Presentation Layer             |
|   • Emerald & White Theme Dashboard                       |
|   • Interactive Visual Architecture Topology Graph        |
|   • Function Signature Decoding Engine (OpenChain/4byte)  |
+-----------------------------+-----------------------------+
                              |
            +-----------------+-----------------+
            |                                   |
            v                                   v
+--------------------------+       +--------------------------+
|  DiamondScope.sol Core   |       |   Target Diamond Core    |
|  (On-Chain Audit Ledger) |       |   (EIP-2535 Loupe Calls) |
|  • requestDiamondCheck() |       |   • facets()             |
|  • publishResult()       |       |   • facetAddresses()     |
|  • Gas-Fee Only (0 Fee)  |       |   • supportsInterface()  |
+--------------------------+       +--------------------------+
```

### 3.1 On-Chain Registry (`DiamondScope.sol`)
The on-chain component serves as an immutable notary of diamond inspections. When a developer inspects a contract:
1. A transaction is submitted to `requestDiamondCheck(address targetDiamond)`.
2. The transaction records the requester's identity, target diamond address, and block timestamp.
3. Once facet data is validated, the metrics are formalized via `publishResult(requestId, facetCount, selectorCount, summary)`.

#### Contract Data Schema
```solidity
struct DiamondRequest {
    uint256 requestId;
    address diamondAddress;
    address requester;
    uint256 timestamp;
    bool isCompleted;
    uint256 facetCount;
    uint256 selectorCount;
    string diagnosticSummary;
}
```

### 3.2 Non-Extractive Economics: Strictly Gas-Fee-Only
Unlike traditional security or notary protocols that introduce arbitrary rent extraction (e.g., protocol tokens, mandatory service fees, or protocol cuts), DiamondScope operates under a **pure gas-fee-only design**:
- `msg.value == 0` is strictly enforced.
- Functions require zero payment to the protocol.
- Users exclusively pay the native network validator gas fees in `BOT` token.

---

## 4. Automated Diagnostic Suite

DiamondScope runs real-time automated security heuristics during every inspection:

| Diagnostic Check | Severity | Description |
| :--- | :--- | :--- |
| **Zero-Address Facet Check** | `CRITICAL` | Detects whether any selector in the dispatch table resolves to `address(0)`. |
| **Selector Collision Check** | `CRITICAL` | Scans all facet definitions to verify strict $1:1$ mapping between selectors and facet contracts. |
| **EIP-2535 Loupe Compliance** | `CRITICAL` | Validates standard `IDiamondLoupe` interface (`0x48e2b093`) and verifies callable methods: `facets()`, `facetFunctionSelectors()`, `facetAddresses()`, and `facetAddress()`. |
| **Empty Facet Detection** | `WARNING` | Flags facet addresses that are registered in the diamond but hold 0 functional selectors. |
| **Upgradeability Vector Audit** | `WARNING` | Verifies presence of `IDiamondCut` (`0x1f931c1c`). Warns if the diamond is fully immutable or lacks cut capabilities. |
| **Ownership & Access Audit** | `WARNING` | Audits whether standard access control (`owner()`, `transferOwnership()`, or `hasRole()`) is registered to protect upgrade functions. |

---

## 5. Network & Deployment Specifications

### 5.1 Botchain Testnet Parameters
- **Chain ID**: `968`
- **RPC URL**: `https://rpc.bohr.life`
- **Native Currency**: `BOT` (18 Decimals)
- **Block Explorer**: `https://scan.bohr.life/`

### 5.2 Canonical Deployments
- **`DiamondScope.sol` Registry**:  
  [`0x7DF571308dbb62a385064B8115F72497CfcC5f34`](https://scan.bohr.life/address/0x7DF571308dbb62a385064B8115F72497CfcC5f34)
- **Reference EIP-2535 Diamond**:  
  [`0x4687550cE4CdCAd54F2b7E0eeDDaa4A49f7fB98E`](https://scan.bohr.life/address/0x4687550cE4CdCAd54F2b7E0eeDDaa4A49f7fB98E)
  - `DiamondCutFacet`: `0x571D629F88BBB51C8811C2142828CE2905192df9`
  - `DiamondLoupeFacet`: `0xB532F24d529115070897B446D8a756Fa58D3bBDE`
  - `OwnershipFacet`: `0x2e73561f29207c24af703F1572c534d8EA2a5a63`
  - `SampleVaultFacet`: `0x6f285f2a94825F07eB2EDB18ebb943E4F3551f27`

---

## 6. Security & Trust Model

1. **Read-Only Non-Destructive Inspection**: Loupe queries are read-only and cannot alter the state of inspected diamonds.
2. **Client-Side Secret Isolation**: Environment variables such as `REOWN_ID` and private keys are never published or exposed in client bundles.
3. **Decentralized Verification**: Every audit recorded on `DiamondScope.sol` is verifiable through public events (`DiamondCheckRequested`, `DiamondCheckPublished`).

---

## 7. Roadmap

- **v1.1**: Automated storage collision checking across facets (AppStorage / DiamondStorage slot hash overlap analysis).
- **v1.2**: Historic facet version diffing: comparing diamond cuts over time from block history.
- **v1.3**: Automated byte-level decompiler integration for unverified facets.

---

## 8. Conclusion

DiamondScope provides a foundational observability layer for modular smart contracts. By coupling standard EIP-2535 Loupe introspection with automated security heuristics and a gas-fee-only on-chain ledger on Botchain Testnet, DiamondScope establishes an open, trustless standard for Diamond contract governance and auditing.
