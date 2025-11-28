// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TransactionStore {
    enum Status { PENDING, APPROVED, REJECTED }

    struct Transaction {
        string id;
        string sender;
        uint256 amount;
        Status status;
        uint256 timestamp;
    }

    mapping(string => Transaction) public transactions;
    string[] public transactionIds;

    event TransactionFinalized(string indexed transactionId, Status status);

    function createTransaction(string memory _id, string memory _sender, uint256 _amount) external {
        require(transactions[_id].timestamp == 0, "Transaction exists");
        transactions[_id] = Transaction(_id, _sender, _amount, Status.PENDING, block.timestamp);
        transactionIds.push(_id);
    }

    function finalizeTransaction(string memory _id, bool _approved) external {
        require(transactions[_id].timestamp != 0, "Transaction not found");
        require(transactions[_id].status == Status.PENDING, "Already finalized");

        transactions[_id].status = _approved ? Status.APPROVED : Status.REJECTED;
        emit TransactionFinalized(_id, transactions[_id].status);
    }

    function getTransaction(string memory _id) external view returns (Transaction memory) {
        return transactions[_id];
    }
}
