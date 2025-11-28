require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bankRoutes = require('./src/routes/bankRoutes');
const { initBank } = require('./src/controllers/bankController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/bank', bankRoutes);

app.listen(PORT, () => {
    initBank();
    console.log(`Bank Service [${process.env.BANK_ID || 'Default'}] running on port ${PORT}`);
});
