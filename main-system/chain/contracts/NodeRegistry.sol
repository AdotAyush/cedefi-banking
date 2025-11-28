// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NodeRegistry {
    struct Node {
        address walletAddress;
        string url;
        bool isActive;
        string name;
    }

    mapping(address => Node) public nodes;
    address[] public nodeAddresses;
    address public admin;

    event NodeRegistered(address indexed nodeAddress, string name);
    event NodeStatusChanged(address indexed nodeAddress, bool isActive);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    function registerNode(address _nodeAddress, string memory _name, string memory _url) external onlyAdmin {
        require(nodes[_nodeAddress].walletAddress == address(0), "Node already registered");
        nodes[_nodeAddress] = Node(_nodeAddress, _url, true, _name);
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
}
