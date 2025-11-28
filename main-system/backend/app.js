require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./src/config/db');
const transactionRoutes = require('./src/routes/transactionRoutes');
const nodeRoutes = require('./src/routes/nodeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/transactions', transactionRoutes);
app.use('/nodes', nodeRoutes);

app.get('/', (req, res) => {
    res.send('CeDeFi Voting System Backend Running');
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
