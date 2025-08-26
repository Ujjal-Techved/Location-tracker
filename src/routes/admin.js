const express = require('express');
const auth = require('../middleware/auth');
const Laptop = require('../models/Laptop');
const User = require('../models/User');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
