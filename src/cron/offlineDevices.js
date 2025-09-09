// cron/checkLocation.js
const cron = require("node-cron");
const pool = require('../config/db');// your PostgreSQL pool

const LOCATION_THRESHOLD_MINUTES = 30; // max allowed gap

function startLocationCheckCron() {
    // Runs every 45 minutes
    cron.schedule("*/45 * * * *", async () => {
        try {
            const threshold = new Date(Date.now() - LOCATION_THRESHOLD_MINUTES * 60 * 1000);

            // Find laptops with no recent location update
            const query = `
                WITH latest_locations AS (
                    SELECT
                        l.id AS laptop_id,
                        MAX(loc.tracked_at) AS last_tracked
                    FROM laptops l
                             LEFT JOIN locations loc ON l.id = loc.laptop_id
                    GROUP BY l.id
                )
                UPDATE laptops
                SET status = 'offline'
                    FROM latest_locations ll
                WHERE laptops.id = ll.laptop_id
                  AND (ll.last_tracked IS NULL OR ll.last_tracked < $1)
                  AND laptops.status = 'online'
                    RETURNING laptops.hostname;
            `;

            const result = await pool.query(query, [threshold]);

            if (result.rowCount > 0) {
                console.log(
                    `[${new Date().toISOString()}] Devices marked OFFLINE due to no recent location:`,
                    result.rows.map(r => r.hostname)
                );
            }
        } catch (err) {
            console.error("Error checking location updates:", err);
        }
    });
}

module.exports = startLocationCheckCron;
