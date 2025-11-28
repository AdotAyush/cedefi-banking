# System Architecture

## Overview
The system is designed to bridge centralized banking trust with decentralized consensus. It allows transactions to be approved either by a super-majority of decentralized nodes (Rule A) or by a combination of bank trust and a simple majority of nodes (Rule B).

## Components

### 1. Centralized Bank Service
- **Role**: Represents a traditional financial institution.
- **Functionality**:
  - Validates transactions off-chain.
  - Signs approvals using a private key (Secp256k1).
  - Exposes REST API for external systems.
- **Independence**: Each bank runs as a separate process with its own keys.

### 2. Blockchain Layer (Hardhat/Solidity)
- **Role**: Immutable ledger and trust anchor.
- **Contracts**:
  - `NodeRegistry`: Manages authorized validator nodes.
  - `VoteManager`: Records votes from nodes.
  - `BankApproval`: Logs bank signatures (optional/event-based).
  - `TransactionStore`: Stores final transaction states.

### 3. Main Backend (Consensus Engine)
- **Role**: Orchestrator.
- **Functionality**:
  - Aggregates votes and bank approvals.
  - Executes Consensus Rules:
    - **Rule A**: `YesVotes >= 2/3 * TotalNodes`
    - **Rule B**: `BankApprovals >= 1 AND YesVotes >= 1/2 * TotalNodes`
  - Writes final results to the Blockchain.
  - Serves data to Frontend.

### 4. Frontend (React)
- **Role**: User Interface.
- **Features**:
  - Real-time dashboard of network health.
  - Transaction creation and monitoring.
  - Simulation tools for testing consensus.

## Data Flow
1.  User submits Transaction -> Backend (Pending).
2.  Backend -> Broadcasts to Banks.
3.  Banks -> Return Signed Approvals.
4.  Nodes (Simulated) -> Cast Votes via Backend.
5.  Backend -> Checks Consensus Rules.
6.  If Consensus Reached -> Backend calls Smart Contract (`finalizeTransaction`).
7.  Smart Contract -> Emits Event -> UI Updates.
