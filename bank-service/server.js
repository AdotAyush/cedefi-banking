require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bankRoutes = require('./src/routes/bankRoutes');
const { initBank } = require('./src/controllers/bankController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST']
}));
app.use(bodyParser.json());

app.use('/bank', bankRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'Bank Service Running', banks: [3001, 3002, 3003] });
});

app.listen(PORT, () => {
    initBank();
    console.log(`Bank Service [${process.env.BANK_ID || 'Default'}] running on port ${PORT}`);
});
