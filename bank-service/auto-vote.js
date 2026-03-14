// Example: Start auto-voting node
const AutoVoteService = require('./src/services/AutoVoteService');

// Node configuration
const NODE_ADDRESS = process.env.NODE_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat Account #1
const MAIN_SYSTEM_URL = process.env.MAIN_SYSTEM_URL || 'http://localhost:5000';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 10000; // 10 seconds

console.log('🚀 Starting Automated Voting Node');
console.log(`Node Address: ${NODE_ADDRESS}`);
console.log(`Main System: ${MAIN_SYSTEM_URL}`);
console.log('='.repeat(50));

// Create and start auto-vote service
const autoVoter = new AutoVoteService(NODE_ADDRESS, MAIN_SYSTEM_URL);
autoVoter.startMonitoring(CHECK_INTERVAL);

// Keep process alive
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down auto-voting service...');
    process.exit(0);
});
