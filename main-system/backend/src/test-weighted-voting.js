const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Test script for weighted voting system
async function testWeightedVoting() {
    console.log('🧪 Testing Weighted Voting System\n');
    console.log('='.repeat(50));

    // Load contract addresses
    const contractsFile = path.resolve(__dirname, '../config/contracts.json');
    const addresses = JSON.parse(fs.readFileSync(contractsFile, 'utf8'));

    // Setup provider and accounts
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const accounts = await provider.listAccounts();
    
    const admin = await provider.getSigner(0);
    const node1 = await provider.getSigner(1);
    const node2 = await provider.getSigner(2);
    const node3 = await provider.getSigner(3);

    console.log(`\n📋 Test Setup:`);
    console.log(`Admin: ${await admin.getAddress()}`);
    console.log(`Node 1: ${await node1.getAddress()}`);
    console.log(`Node 2: ${await node2.getAddress()}`);
    console.log(`Node 3: ${await node3.getAddress()}`);

    // Load ABIs
    const getABI = (name) => {
        const artifact = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, `../../../chain/artifacts/contracts/${name}.sol/${name}.json`),
                'utf8'
            )
        );
        return artifact.abi;
    };

    const nodeRegistryABI = getABI('NodeRegistry');
    const voteManagerABI = getABI('VoteManager');

    const nodeRegistry = new ethers.Contract(addresses.NodeRegistry, nodeRegistryABI, admin);
    const voteManager = new ethers.Contract(addresses.VoteManager, voteManagerABI, admin);

    console.log('\n' + '='.repeat(50));
    console.log('📝 Step 1: Register Nodes');
    console.log('='.repeat(50));

    // Register 3 nodes
    try {
        await nodeRegistry.registerNode(await node1.getAddress(), 'Node 1', 'http://node1.local');
        console.log('✓ Node 1 registered');
    } catch (e) {
        console.log('⚠ Node 1 already registered');
    }

    try {
        await nodeRegistry.registerNode(await node2.getAddress(), 'Node 2', 'http://node2.local');
        console.log('✓ Node 2 registered');
    } catch (e) {
        console.log('⚠ Node 2 already registered');
    }

    try {
        await nodeRegistry.registerNode(await node3.getAddress(), 'Node 3', 'http://node3.local');
        console.log('✓ Node 3 registered');
    } catch (e) {
        console.log('⚠ Node 3 already registered');
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Step 2: Check Initial Reputations');
    console.log('='.repeat(50));

    const rep1 = await nodeRegistry.getNodeReputation(await node1.getAddress());
    const rep2 = await nodeRegistry.getNodeReputation(await node2.getAddress());
    const rep3 = await nodeRegistry.getNodeReputation(await node3.getAddress());

    console.log(`Node 1 reputation: ${rep1} / 100`);
    console.log(`Node 2 reputation: ${rep2} / 100`);
    console.log(`Node 3 reputation: ${rep3} / 100`);

    console.log('\n' + '='.repeat(50));
    console.log('🗳️ Step 3: Cast Weighted Votes');
    console.log('='.repeat(50));

    const txId = 'test-tx-' + Date.now();
    console.log(`Transaction ID: ${txId}\n`);

    // Node 1 votes YES
    const tx1 = await voteManager.connect(node1).castVote(txId, true);
    await tx1.wait();
    console.log('✓ Node 1 voted YES');

    // Node 2 votes YES
    const tx2 = await voteManager.connect(node2).castVote(txId, true);
    await tx2.wait();
    console.log('✓ Node 2 voted YES');

    // Node 3 votes NO
    const tx3 = await voteManager.connect(node3).castVote(txId, false);
    await tx3.wait();
    console.log('✓ Node 3 voted NO');

    console.log('\n' + '='.repeat(50));
    console.log('📈 Step 4: Check Vote Counts');
    console.log('='.repeat(50));

    // Unweighted count
    const [yesCount, noCount] = await voteManager.getVoteCount(txId);
    console.log(`\nUnweighted Votes:`);
    console.log(`  YES: ${yesCount}`);
    console.log(`  NO: ${noCount}`);

    // Weighted count
    const [yesWeight, noWeight] = await voteManager.getWeightedVoteCount(txId);
    console.log(`\nWeighted Votes:`);
    console.log(`  YES Weight: ${yesWeight} (from ${yesCount} votes)`);
    console.log(`  NO Weight: ${noWeight} (from ${noCount} votes)`);
    console.log(`  Total Weight: ${Number(yesWeight) + Number(noWeight)}`);

    // Calculate consensus
    const maxWeight = 300; // 3 nodes × 100 max reputation
    const threshold = maxWeight * 2 / 3;
    console.log(`\nConsensus Threshold: ${threshold} (2/3 of ${maxWeight})`);
    console.log(`Result: ${Number(yesWeight) >= threshold ? '✅ APPROVED' : '❌ REJECTED'}`);

    console.log('\n' + '='.repeat(50));
    console.log('🔄 Step 5: Simulate HYBRID Reputation Update');
    console.log('='.repeat(50));

    // HYBRID APPROACH: Use BANK decision as ground truth
    // Scenario: Banks APPROVED the transaction
    const bankApproved = true;
    
    console.log(`\nGround Truth: Banks ${bankApproved ? 'APPROVED' : 'REJECTED'} the transaction`);
    console.log('Nodes judged against BANK decision (external truth)\n');

    // Node 1 voted YES, banks said YES → CORRECT
    console.log('Node 1: voted YES, banks said YES');
    await nodeRegistry.incrementCorrectVote(await node1.getAddress());
    console.log('✓ Node 1 reputation updated (+5 for agreeing with banks)');

    // Node 2 voted YES, banks said YES → CORRECT  
    console.log('\nNode 2: voted YES, banks said YES');
    await nodeRegistry.incrementCorrectVote(await node2.getAddress());
    console.log('✓ Node 2 reputation updated (+5 for agreeing with banks)');

    // Node 3 voted NO, banks said YES → WRONG
    console.log('\nNode 3: voted NO, banks said YES');
    await nodeRegistry.incrementIncorrectVote(await node3.getAddress());
    console.log('✓ Node 3 reputation updated (-3 for disagreeing with banks)');
    
    console.log('\n' + '-'.repeat(50));
    console.log('💡 Key Insight: Reputation based on BANK decision');
    console.log('   NOT based on consensus outcome!');
    console.log('   This prevents circular logic where high-rep nodes');
    console.log('   always define "correctness"');
    console.log('-'.repeat(50));

    console.log('\n' + '='.repeat(50));
    console.log('📊 Step 6: Check Updated Reputations');
    console.log('='.repeat(50));

    const newRep1 = await nodeRegistry.getNodeReputation(await node1.getAddress());
    const newRep2 = await nodeRegistry.getNodeReputation(await node2.getAddress());
    const newRep3 = await nodeRegistry.getNodeReputation(await node3.getAddress());

    const node1Data = await nodeRegistry.nodes(await node1.getAddress());
    const node2Data = await nodeRegistry.nodes(await node2.getAddress());
    const node3Data = await nodeRegistry.nodes(await node3.getAddress());

    console.log(`\nNode 1:`);
    console.log(`  Reputation: ${rep1} → ${newRep1} (${Number(newRep1) - Number(rep1) >= 0 ? '+' : ''}${Number(newRep1) - Number(rep1)})`);
    console.log(`  Total Votes: ${node1Data.totalVotes}`);
    console.log(`  Correct Votes: ${node1Data.correctVotes}`);
    console.log(`  Accuracy: ${node1Data.totalVotes > 0 ? ((Number(node1Data.correctVotes) / Number(node1Data.totalVotes)) * 100).toFixed(2) : 0}%`);

    console.log(`\nNode 2:`);
    console.log(`  Reputation: ${rep2} → ${newRep2} (${Number(newRep2) - Number(rep2) >= 0 ? '+' : ''}${Number(newRep2) - Number(rep2)})`);
    console.log(`  Total Votes: ${node2Data.totalVotes}`);
    console.log(`  Correct Votes: ${node2Data.correctVotes}`);
    console.log(`  Accuracy: ${node2Data.totalVotes > 0 ? ((Number(node2Data.correctVotes) / Number(node2Data.totalVotes)) * 100).toFixed(2) : 0}%`);

    console.log(`\nNode 3:`);
    console.log(`  Reputation: ${rep3} → ${newRep3} (${Number(newRep3) - Number(rep3) >= 0 ? '+' : ''}${Number(newRep3) - Number(rep3)})`);
    console.log(`  Total Votes: ${node3Data.totalVotes}`);
    console.log(`  Correct Votes: ${node3Data.correctVotes}`);
    console.log(`  Accuracy: ${node3Data.totalVotes > 0 ? ((Number(node3Data.correctVotes) / Number(node3Data.totalVotes)) * 100).toFixed(2) : 0}%`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test Complete!');
    console.log('='.repeat(50));
    console.log('\n🎯 HYBRID REPUTATION SYSTEM Key Features:');
    console.log('1. Nodes start with reputation 50');
    console.log('2. Votes are weighted by reputation (prevents Sybil attacks)');
    console.log('3. Banks provide EXTERNAL GROUND TRUTH (no circular logic)');
    console.log('4. Correct votes = agreeing with BANKS (not consensus)');
    console.log('5. Reputation caps at 95 (prevents single-node dominance)');
    console.log('6. Tiered growth: +5 normal, +3 moderate, +2 capped');
    console.log('7. Over time, accurate nodes gain influence fairly\n');
    
    console.log('🔒 Security Benefits:');
    console.log('✓ No circular logic (high-rep nodes don\'t define truth)');
    console.log('✓ External validators (banks) provide objectivity');
    console.log('✓ Caps prevent unstoppable dominance');
    console.log('✓ New nodes can catch up with accurate voting');
    console.log('✓ Game theory encourages real fraud detection\n');
}

// Run test
testWeightedVoting()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
