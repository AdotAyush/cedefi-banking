// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NodeRegistry.sol";

contract VoteManager {
    NodeRegistry public nodeRegistry;

    struct Vote {
        address voter;
        bool decision; // true = approve, false = reject
        uint256 timestamp;
        uint256 weight; // Vote weight based on reputation
    }

    // transactionId => votes
    mapping(string => Vote[]) public transactionVotes;
    // transactionId => voter => hasVoted
    mapping(string => mapping(address => bool)) public hasVoted;

    event VoteCast(string indexed transactionId, address indexed voter, bool decision, uint256 weight);

    constructor(address _nodeRegistry) {
        nodeRegistry = NodeRegistry(_nodeRegistry);
    }

    function castVote(string memory _transactionId, bool _decision) external {
        require(nodeRegistry.isNodeActive(msg.sender), "Not an active node");
        require(!hasVoted[_transactionId][msg.sender], "Already voted");

        // Calculate vote weight based on reputation (0-100)
        uint256 reputation = nodeRegistry.getNodeReputation(msg.sender);
        uint256 weight = reputation; // Weight = reputation score

        transactionVotes[_transactionId].push(Vote(msg.sender, _decision, block.timestamp, weight));
        hasVoted[_transactionId][msg.sender] = true;

        emit VoteCast(_transactionId, msg.sender, _decision, weight);
    }

    function getVoteCount(string memory _transactionId) external view returns (uint256 yes, uint256 no) {
        Vote[] memory votes = transactionVotes[_transactionId];
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].decision) {
                yes++;
            } else {
                no++;
            }
        }
    }

    function getWeightedVoteCount(string memory _transactionId) external view returns (uint256 yesWeight, uint256 noWeight) {
        Vote[] memory votes = transactionVotes[_transactionId];
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].decision) {
                yesWeight += votes[i].weight;
            } else {
                noWeight += votes[i].weight;
            }
        }
    }

    function getVotes(string memory _transactionId) external view returns (Vote[] memory) {
        return transactionVotes[_transactionId];
    }
}
