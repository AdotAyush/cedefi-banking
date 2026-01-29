const axios = require('axios');

const BANKS = [
    process.env.BANK_A_URL || 'http://localhost:3001',
    process.env.BANK_B_URL || 'http://localhost:3002',
    process.env.BANK_C_URL || 'http://localhost:3003'
];

const REQUEST_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 2;

/**
 * Request approval from a single bank with retry logic
 */
const requestApproval = async (bankUrl, transaction, retryCount = 0) => {
    try {
        console.log(`[BankIntegration] Requesting approval from ${bankUrl} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

        const response = await axios.post(`${bankUrl}/bank/approve`, {
            transactionId: transaction.transactionId,
            sender: transaction.sender,
            amount: transaction.amount
        }, {
            timeout: REQUEST_TIMEOUT,
            validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        });

        if (response.status === 200 && response.data) {
            console.log(`[BankIntegration] ✓ Approval received from ${bankUrl}`);
            return response.data;
        }

        console.warn(`[BankIntegration] Bank ${bankUrl} returned status ${response.status}`);
        return null;

    } catch (error) {
        const isLastAttempt = retryCount >= MAX_RETRIES;

        // Handle specific error types
        if (error.code === 'ECONNREFUSED') {
            console.warn(`[BankIntegration] Bank ${bankUrl} is offline (connection refused)`);
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.warn(`[BankIntegration] Bank ${bankUrl} timeout after ${REQUEST_TIMEOUT}ms`);

            // Retry on timeout if not last attempt
            if (!isLastAttempt) {
                console.log(`[BankIntegration] Retrying ${bankUrl}...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                return requestApproval(bankUrl, transaction, retryCount + 1);
            }
        } else {
            console.error(`[BankIntegration] Error from ${bankUrl}:`, error.message);
        }

        return null;
    }
};

/**
 * Broadcast transaction to all banks and collect approvals
 * This function is fail-safe: it will return available approvals even if some banks fail
 */
const broadcastToBanks = async (transaction) => {
    console.log(`[BankIntegration] Broadcasting transaction ${transaction.transactionId} to ${BANKS.length} banks`);

    try {
        const promises = BANKS.map(url => requestApproval(url, transaction));
        const results = await Promise.allSettled(promises); // Won't throw even if all fail

        const approvals = results
            .map((result, index) => {
                if (result.status === 'fulfilled' && result.value && result.value.approved) {
                    return result.value;
                }
                return null;
            })
            .filter(res => res !== null);

        console.log(`[BankIntegration] Collected ${approvals.length}/${BANKS.length} bank approvals`);
        return approvals;

    } catch (error) {
        // This should never happen with Promise.allSettled, but be defensive
        console.error('[BankIntegration] Critical error in broadcastToBanks:', error);
        return []; // Return empty array to prevent breaking transaction flow
    }
};

/**
 * Check bank service health
 * Returns status of all banks
 */
const checkBankHealth = async () => {
    const healthChecks = await Promise.allSettled(
        BANKS.map(async (url) => {
            try {
                const response = await axios.get(`${url}/health`, { timeout: 2000 });
                return { url, status: 'online', response: response.data };
            } catch (error) {
                return { url, status: 'offline', error: error.message };
            }
        })
    );

    return healthChecks.map(result => result.value || { status: 'error' });
};

module.exports = { broadcastToBanks, checkBankHealth };
