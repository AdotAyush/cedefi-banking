const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const NodeRegistry = await hre.ethers.getContractFactory("NodeRegistry");
    const nodeRegistry = await NodeRegistry.deploy();
    await nodeRegistry.waitForDeployment();
    console.log("NodeRegistry deployed to:", await nodeRegistry.getAddress());

    const VoteManager = await hre.ethers.getContractFactory("VoteManager");
    const voteManager = await VoteManager.deploy(await nodeRegistry.getAddress());
    await voteManager.waitForDeployment();
    console.log("VoteManager deployed to:", await voteManager.getAddress());

    const BankApproval = await hre.ethers.getContractFactory("BankApproval");
    const bankApproval = await BankApproval.deploy();
    await bankApproval.waitForDeployment();
    console.log("BankApproval deployed to:", await bankApproval.getAddress());

    const TransactionStore = await hre.ethers.getContractFactory("TransactionStore");
    const transactionStore = await TransactionStore.deploy();
    await transactionStore.waitForDeployment();
    console.log("TransactionStore deployed to:", await transactionStore.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
