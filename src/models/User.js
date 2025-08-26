const pool = require('../config/db');

const User = {
  async create(username, passwordHash, role='user') {
    const res = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, passwordHash, role]
    );
    return res.rows[0];
  },

  async findByUsername(username) {
    const res = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    return res.rows[0];
  },

  async findById(id) {
    const res = await pool.query('SELECT id, username, role FROM users WHERE id=$1', [id]);
    return res.rows[0];
  }
};

module.exports = User;
