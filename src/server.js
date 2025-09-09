const express = require('express');
const cors = require('cors');
const startLocationCheckCron = require("./cron/offlineDevices");

require('dotenv').config();

const authRoutes = require('./routes/auth');
const laptopRoutes = require('./routes/laptops');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/laptops', laptopRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
startLocationCheckCron();
