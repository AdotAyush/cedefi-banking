// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BankApproval {
    struct Approval {
        string bankId;
        bytes signature;
        uint256 timestamp;
    }

    mapping(string => Approval[]) public approvals;
    mapping(string => mapping(string => bool)) public hasBankApproved; // txId -> bankId -> bool

    event BankApproved(string indexed transactionId, string bankId);

    function recordApproval(string memory _transactionId, string memory _bankId, bytes memory _signature) external {
        require(!hasBankApproved[_transactionId][_bankId], "Bank already approved");
        
        approvals[_transactionId].push(Approval(_bankId, _signature, block.timestamp));
        hasBankApproved[_transactionId][_bankId] = true;

        emit BankApproved(_transactionId, _bankId);
    }

    function getApprovalCount(string memory _transactionId) external view returns (uint256) {
        return approvals[_transactionId].length;
    }
}
