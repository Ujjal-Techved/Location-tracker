const express = require('express');
const Laptop = require('../models/Laptop');
const axios = require("axios");
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/laptops', auth, async (req, res) => {
  try {
    if (!req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const rows = await Laptop.getAll();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Track laptop location (authenticated user or agent can post)
router.post('/track', async (req, res) => {
  try {
    const { hostname, ip, os, cpu_percent, disk_percent, memory_percent, battery} = req.body;
    if (!hostname) return res.status(400).json({ error: 'hostname required' });
    if (!ip) return res.status(400).json({ error: 'ip required' });
    let laptopId = await Laptop.findByHostName(hostname);
    if (!laptopId) return res.status(400).json({ error: `Laptop data not found for ${hostname}` });
    let locationData = {};
    try {
      const resp = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,isp`);
      if (resp.data.status === "success") {
        locationData = {
          city: resp.data.city,
          region: resp.data.regionName,
          country: resp.data.country,
          isp: resp.data.isp,
          latitude: resp.data.lat,
          longitude: resp.data.lon
        };
      } else {
        console.warn(`IP lookup failed: ${resp.data.message}`);
      }
    } catch (e) {
      console.error("IP API error:", e.message);
    }
    const saved = await Laptop.addLocation(laptopId, { ip, os, cpu_percent, disk_percent, memory_percent, battery, ...locationData });
    res.json({ ok: true, saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/register', auth, async (req, res) => {
  try {
    const { hostname, username, os, status } = req.body;
    if (!hostname) return res.status(400).json({ error: 'hostname required' });
    if (!username) return res.status(400).json({ error: 'username required' });
    if (!os) return res.status(400).json({ error: 'os required' });
    if (!status) return res.status(400).json({ error: 'status required' });

    const saved = await Laptop.add({hostname: hostname, username: username, os: os, status: status, created_by: req.user.id });
    res.json({ ok: true, saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/isUsernameExists', auth, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const ifExists = await Laptop.ifExists(username);
    res.json({ ok: true, ifExists: ifExists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
