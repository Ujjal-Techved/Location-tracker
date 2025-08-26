const pool = require('../config/db');

const Laptop = {
  async add(data) {
    const res = await pool.query(
      `INSERT INTO laptops (hostname, username, os, status, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [data.hostname||null, data.username||null, data.os||null, data.status||null, data.created_by||null]
    );
    return res.rows[0];
  },
  async addLocation(laptopId, data) {
    const res = await pool.query(
        `INSERT INTO locations (laptop_id, ip, city, region, country, latitude, longitude, isp, cpu_percent, memory_percent, disk_percent, battery, tracked_at)
       VALUES ($1,$2,$3,$4,$5, $6, $7, $8, $9, $10, $11, $12 ,NOW()) RETURNING *`,
        [laptopId, data.ip||null, data.city||null, data.region||null, data.country||null, data.latitude||null, data.longitude||null, data.isp||null, data.cpu_percent||null, data.memory_percent||null, data.disk_percent||null, data.battery||null]
    );
    return res.rows[0];
  },

  async findByHostName(hostname) {
    const res = await pool.query(
        'SELECT id  FROM laptops WHERE hostname = $1',
        [hostname]
    );
    if (res.rows.length) {
      return res.rows[0].id;
    } else {
      return null;
    }
  },

  async getAll() {
    const res = await pool.query('SELECT l.*,\n' +
        '       COALESCE(\n' +
        '         json_agg(\n' +
        '           json_build_object(\n' +
        '             \'id\', loc.id,\n' +
        '             \'ip\', loc.ip,\n' +
        '             \'city\', loc.city,\n' +
        '             \'region\', loc.region,\n' +
        '             \'country\', loc.country,\n' +
        '             \'latitude\', loc.latitude,\n' +
        '             \'longitude\', loc.longitude,\n' +
        '             \'tracked_at\', loc.tracked_at,\n' +
        '             \'isp\', loc.isp,\n' +
        '             \'cpu_percent\', loc.cpu_percent,\n' +
        '             \'memory_percent\', loc.memory_percent,\n' +
        '             \'disk_percent\', loc.disk_percent,\n' +
        '             \'battery\', loc.battery\n' +
        '           )\n' +
        '           ORDER BY loc.tracked_at DESC\n' +
        '         ) FILTER (WHERE loc.id IS NOT NULL),\n' +
        '         \'[]\'\n' +
        '       ) AS locations\n' +
        'FROM laptops l\n' +
        'LEFT JOIN locations loc ON l.id = loc.laptop_id\n' +
        'GROUP BY l.id\n' +
        'ORDER BY l.created_at DESC;\n');
    return res.rows;
  }
};

module.exports = Laptop;
