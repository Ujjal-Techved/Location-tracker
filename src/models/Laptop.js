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
        `INSERT INTO locations
         (laptop_id, fulladdress, city, county, state, postcode, district, country, os, cpu_percent, memory_percent, disk_percent, battery, latitude, longitude, tracked_at)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           RETURNING *`,
        [
          laptopId,
          data.fulladdress || null,
          data.city || null,
          data.county || null,
          data.state || null,
          data.postcode || null,
          data.district || null,
          data.country || null,
          data.os || null,
          data.cpu_percent || null,
          data.memory_percent || null,
          data.disk_percent || null,
          data.battery || null,
          data.latitude || null,
          data.longitude || null,
          data.tracked_at || new Date()
        ]
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
    async findByHostname(hostname) {
        const result = await pool.query("SELECT * FROM laptops WHERE hostname = $1", [hostname]);
        return result.rows[0] || null;
    },

    async updateInstructions(hostname, { instructions, payload }) {
        const validKeys = ["alert", "lock", "update_location", "mark_stolen"];
        const fields = [];
        const values = [];
        let idx = 1;


        for (const key of validKeys) {
            if (key in instructions) {
                fields.push(`${key} = $${idx}`);
                values.push(instructions[key] === true);
                idx++;
            }
        }
        fields.push(`status = $${idx}`);
        values.push("online");
        idx++;
        if (fields.length > 0) {
            // Update laptops table with flags
            values.push(hostname);
            const query = `UPDATE laptops SET ${fields.join(", ")} WHERE hostname=$${idx} RETURNING *`;
            await pool.query(query, values);
        }

        // Always log payload (even if no boolean flags changed)
        await pool.query(
            `INSERT INTO laptop_instructions_log (hostname, action, payload) VALUES ($1, $2, $3)`,
            [hostname, Object.keys(instructions).find(k => instructions[k]), payload || {}]
        );

        // Return updated laptop
        const result = await pool.query(`SELECT * FROM laptops WHERE hostname=$1`, [hostname]);
        return result.rows[0];
    },
    async getAll() {
        const res = await pool.query(`
            SELECT l.*,
                   COALESCE(
                           (
                               SELECT json_agg(
                                              json_build_object(
                                                      'id', loc.id,
                                                      'fulladdress', loc.fulladdress,
                                                      'city', loc.city,
                                                      'county', loc.county,
                                                      'state', loc.state,
                                                      'postcode', loc.postcode,
                                                      'district', loc.district,
                                                      'country', loc.country,
                                                      'os', loc.os,
                                                      'latitude', loc.latitude,
                                                      'longitude', loc.longitude,
                                                      'tracked_at', loc.tracked_at,
                                                      'cpu_percent', loc.cpu_percent,
                                                      'memory_percent', loc.memory_percent,
                                                      'disk_percent', loc.disk_percent,
                                                      'battery', loc.battery
                                              )
                                                  ORDER BY loc.tracked_at DESC
                                      )
                               FROM locations loc
                               WHERE loc.laptop_id = l.id
                           ),
                           '[]'
                   ) AS locations,
                   COALESCE(
                           (
                               SELECT json_agg(
                                              json_build_object(
                                                      'id', log.id,
                                                      'hostname', log.hostname,
                                                      'action', log.action,
                                                      'payload', log.payload,
                                                      'created_at', log.created_at
                                              )
                                                  ORDER BY log.created_at DESC
                                      )
                               FROM laptop_instructions_log log
                               WHERE log.hostname = l.hostname
                           ),
                           '[]'
                   ) AS logs
            FROM laptops l
            ORDER BY l.created_at DESC;
        `);
        return res.rows;
    },



};

module.exports = Laptop;
