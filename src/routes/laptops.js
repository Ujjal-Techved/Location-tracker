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
router.get('/instructions', async (req, res) => {
  try {
    const deviceId = req.query.device_id;
    if (!deviceId) return res.status(400).json({ error: "device_id is required" });

    // Fetch laptop from DB
    const laptop = await Laptop.findByHostname(deviceId);
    if (!laptop) {
      return res.status(404).json({ error: "Device not found" });
    }

    const instructions = {
      alert: laptop.alert,
      lock: laptop.lock,
      update_location: laptop.update_location,
      mark_stolen: laptop.mark_stolen,
    };

    res.json(instructions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post("/instructions", async (req, res) => {
  try {
    const { device_id, instructions, payload } = req.body;
    if (!device_id || !instructions) {
      return res.status(400).json({ error: "device_id and instructions required" });
    }

    // Validate instructions
    const validKeys = ["alert", "lock", "update_location", "mark_stolen"];
    const sanitized = {};
    validKeys.forEach((key) => {
      sanitized[key] = instructions[key] === true;
    });

    // Attach payload (only if needed)
    const actionData = {
      instructions: sanitized,
      payload: payload || {}
    };

    // Update DB (assuming Laptop model supports payload)
    const updated = await Laptop.updateInstructions(device_id, actionData);

    res.json({ success: true, device: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Track laptop location (authenticated user or agent can post)
router.post('/track', async (req, res) => {
  try {
    console.log(req.body);
    const { fulladdress, city, state, postcode, district, country, latitude, longitude, hostname, tracked_at, cpu_percent, disk_percent, memory_percent, battery, os_name} = req.body;
    if (!hostname) return res.status(400).json({ error: 'hostname required' });
    let laptopId = await Laptop.findByHostName(hostname);
    if (!laptopId) return res.status(400).json({ error: `Laptop data not found for ${hostname}` });
    let locationData = {};
    try {
      locationData = {
        fulladdress: fulladdress,
        city: city,
        state: state,
        postcode: postcode,
        district: district,
        country: country,
        latitude: latitude,
        longitude: longitude,
        tracked_at: tracked_at,
        cpu_percent: cpu_percent,
        disk_percent: disk_percent,
        memory_percent: memory_percent,
        battery: battery,
        os: os_name
      };
    } catch (e) {
      console.error("Data Error:", e.message);
    }
    const saved = await Laptop.addLocation(laptopId, locationData);
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
