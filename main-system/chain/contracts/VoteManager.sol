// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NodeRegistry.sol";

contract VoteManager {
    NodeRegistry public nodeRegistry;

    struct Vote {
        address voter;
        bool decision; // true = approve, false = reject
        uint256 timestamp;
    }

    // transactionId => votes
    mapping(string => Vote[]) public transactionVotes;
    // transactionId => voter => hasVoted
    mapping(string => mapping(address => bool)) public hasVoted;

    event VoteCast(string indexed transactionId, address indexed voter, bool decision);

    constructor(address _nodeRegistry) {
        nodeRegistry = NodeRegistry(_nodeRegistry);
    }

    function castVote(string memory _transactionId, bool _decision) external {
        require(nodeRegistry.isNodeActive(msg.sender), "Not an active node");
        require(!hasVoted[_transactionId][msg.sender], "Already voted");

        transactionVotes[_transactionId].push(Vote(msg.sender, _decision, block.timestamp));
        hasVoted[_transactionId][msg.sender] = true;

        emit VoteCast(_transactionId, msg.sender, _decision);
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
}
