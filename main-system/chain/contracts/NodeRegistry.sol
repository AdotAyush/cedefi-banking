// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NodeRegistry {
    struct Node {
        address walletAddress;
        string url;
        bool isActive;
        string name;
        uint256 reputation; // 0-100, starts at 50
        uint256 totalVotes;
        uint256 correctVotes;
    }

    mapping(address => Node) public nodes;
    address[] public nodeAddresses;
    address public admin;

    event NodeRegistered(address indexed nodeAddress, string name);
    event NodeStatusChanged(address indexed nodeAddress, bool isActive);
    event ReputationUpdated(address indexed nodeAddress, uint256 newReputation);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    function registerNode(address _nodeAddress, string memory _name, string memory _url) external onlyAdmin {
        require(nodes[_nodeAddress].walletAddress == address(0), "Node already registered");
        nodes[_nodeAddress] = Node(_nodeAddress, _url, true, _name, 50, 0, 0); // Start at reputation 50
        nodeAddresses.push(_nodeAddress);
        emit NodeRegistered(_nodeAddress, _name);
    }

    function setNodeStatus(address _nodeAddress, bool _isActive) external onlyAdmin {
        require(nodes[_nodeAddress].walletAddress != address(0), "Node not found");
        nodes[_nodeAddress].isActive = _isActive;
        emit NodeStatusChanged(_nodeAddress, _isActive);
    }

    function getActiveNodeCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < nodeAddresses.length; i++) {
            if (nodes[nodeAddresses[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    function isNodeActive(address _node) external view returns (bool) {
        return nodes[_node].isActive;
    }

    function getNodeReputation(address _node) external view returns (uint256) {
        return nodes[_node].reputation;
    }

    function updateReputation(address _node, uint256 _newReputation) external onlyAdmin {
        require(nodes[_node].walletAddress != address(0), "Node not found");
        require(_newReputation <= 100, "Reputation must be <= 100");
        nodes[_node].reputation = _newReputation;
        emit ReputationUpdated(_node, _newReputation);
    }

    function incrementCorrectVote(address _node) external onlyAdmin {
        require(nodes[_node].walletAddress != address(0), "Node not found");
        nodes[_node].totalVotes++;
        nodes[_node].correctVotes++;
        
        // Increase reputation by 5, cap at 100
        uint256 newRep = nodes[_node].reputation + 5;
        if (newRep > 100) newRep = 100;
        nodes[_node].reputation = newRep;
        emit ReputationUpdated(_node, newRep);
    }

    function incrementIncorrectVote(address _node) external onlyAdmin {
        require(nodes[_node].walletAddress != address(0), "Node not found");
        nodes[_node].totalVotes++;
        
        // Decrease reputation by 3, floor at 0
        uint256 newRep = nodes[_node].reputation;
        if (newRep >= 3) {
            newRep -= 3;
        } else {
            newRep = 0;
        }
        nodes[_node].reputation = newRep;
        emit ReputationUpdated(_node, newRep);
    }
}
