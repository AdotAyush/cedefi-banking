const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dropIndex = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/cedefi-voting';
        console.log('Connecting to MongoDB:', uri);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        try {
            await mongoose.connection.collection('users').dropIndex('username_1');
            console.log('Successfully dropped index: username_1');
        } catch (err) {
            if (err.codeName === 'IndexNotFound' || err.message.includes('index not found')) {
                console.log('Index username_1 does not exist, skipping drop.');
            } else {
                throw err;
            }
        }

        console.log('Database maintenance complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error during maintenance:', err);
        process.exit(1);
    }
};

dropIndex();
