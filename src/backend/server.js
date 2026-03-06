// ============================================================
// Cricket Scoring API — Express Backend Server
// Provides REST API + SSE for the 4-container architecture
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── PostgreSQL Connection ────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://cricket:cricket123@localhost:5432/cricket_db',
});

// ── Redis Connection ─────────────────────────────────────────
let redisClient;
let redisReady = false;

async function initRedis() {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        redisClient.on('error', (err) => console.error('Redis error:', err));
        redisClient.on('ready', () => { redisReady = true; console.log('Redis connected'); });
        await redisClient.connect();
    } catch (err) {
        console.error('Redis connection failed, running without cache:', err.message);
    }
}

// Cache helpers
async function cacheGet(key) {
    if (!redisReady) return null;
    try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
    } catch { return null; }
}

async function cacheSet(key, data, ttlSeconds = 2) {
    if (!redisReady) return;
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: ttlSeconds });
    } catch { /* ignore cache errors */ }
}

async function cacheInvalidate(...keys) {
    if (!redisReady) return;
    try {
        await redisClient.del(keys);
    } catch { /* ignore */ }
}

// ── SSE (Server-Sent Events) ─────────────────────────────────
const sseClients = new Set();

function addSSEClient(res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });
    res.write('data: {"type":"connected"}\n\n');
    sseClients.add(res);
    res.on('close', () => sseClients.delete(res));
}

function broadcastSSE(eventType, data) {
    const payload = JSON.stringify({ type: eventType, data });
    for (const client of sseClients) {
        client.write(`data: ${payload}\n\n`);
    }
}

// SSE endpoint
app.get('/api/events', (req, res) => {
    addSSEClient(res);
});


// ══════════════════════════════════════════════════════════════
// MATCH STATE ROUTES
// ══════════════════════════════════════════════════════════════

// GET current match state
app.get('/api/match-state', async (req, res) => {
    try {
        // Check cache first
        const cached = await cacheGet('match_state');
        if (cached) return res.json(cached);

        const { rows } = await pool.query("SELECT * FROM match_state WHERE id = 'current'");
        if (rows.length === 0) return res.status(404).json({ error: 'No match state found' });

        await cacheSet('match_state', rows[0]);
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /api/match-state error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update match state
app.put('/api/match-state', async (req, res) => {
    try {
        const updates = req.body;
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No update data provided' });
        }

        // Build dynamic SET clause
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

        const { rows } = await pool.query(
            `UPDATE match_state SET ${setClauses} WHERE id = 'current' RETURNING *`,
            values
        );

        await cacheInvalidate('match_state');
        broadcastSSE('match_state_update', rows[0]);
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /api/match-state error:', err);
        res.status(500).json({ error: err.message });
    }
});


// ══════════════════════════════════════════════════════════════
// COMMENTARY ROUTES
// ══════════════════════════════════════════════════════════════

// GET latest commentary
app.get('/api/commentary', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const cached = await cacheGet('commentary');
        if (cached) return res.json(cached);

        const { rows } = await pool.query(
            'SELECT * FROM commentary ORDER BY created_at DESC LIMIT $1',
            [limit]
        );

        await cacheSet('commentary', rows);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/commentary error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST new commentary
app.post('/api/commentary', async (req, res) => {
    try {
        const { type, text, overs, event_badge, bowler_batter_title } = req.body;

        const { rows } = await pool.query(
            `INSERT INTO commentary (type, text, overs, event_badge, bowler_batter_title)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [type || 'text', text || '', overs || null, event_badge || null, bowler_batter_title || null]
        );

        await cacheInvalidate('commentary');
        broadcastSSE('commentary_insert', rows[0]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('POST /api/commentary error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST bulk commentary (multiple items)
app.post('/api/commentary/bulk', async (req, res) => {
    try {
        const items = req.body; // Array of commentary objects
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Expected array of commentary items' });
        }

        const results = [];
        for (const item of items) {
            const { rows } = await pool.query(
                `INSERT INTO commentary (type, text, overs, event_badge, bowler_batter_title)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [item.type || 'text', item.text || '', item.overs || null, item.event_badge || null, item.bowler_batter_title || null]
            );
            results.push(rows[0]);
        }

        await cacheInvalidate('commentary');
        for (const row of results) {
            broadcastSSE('commentary_insert', row);
        }
        res.status(201).json(results);
    } catch (err) {
        console.error('POST /api/commentary/bulk error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update commentary item
app.put('/api/commentary/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, event_badge } = req.body;

        const { rows } = await pool.query(
            'UPDATE commentary SET text = $1, event_badge = $2 WHERE id = $3 RETURNING *',
            [text, event_badge || null, id]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Commentary not found' });

        await cacheInvalidate('commentary');
        broadcastSSE('commentary_update', rows[0]);
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /api/commentary/:id error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE commentary item
app.delete('/api/commentary/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('DELETE FROM commentary WHERE id = $1 RETURNING *', [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Commentary not found' });

        await cacheInvalidate('commentary');
        broadcastSSE('commentary_delete', { id: parseInt(id) });
        res.json({ success: true, deleted: rows[0] });
    } catch (err) {
        console.error('DELETE /api/commentary/:id error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE all commentary
app.delete('/api/commentary', async (req, res) => {
    try {
        await pool.query('DELETE FROM commentary');
        await cacheInvalidate('commentary');
        broadcastSSE('commentary_clear', {});
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/commentary error:', err);
        res.status(500).json({ error: err.message });
    }
});


// ══════════════════════════════════════════════════════════════
// ROSTER ROUTES
// ══════════════════════════════════════════════════════════════

// GET all roster entries
app.get('/api/roster', async (req, res) => {
    try {
        const cached = await cacheGet('roster');
        if (cached) return res.json(cached);

        const { rows } = await pool.query('SELECT * FROM roster ORDER BY id');
        await cacheSet('roster', rows);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/roster error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST bulk insert roster entries
app.post('/api/roster', async (req, res) => {
    try {
        const items = req.body; // Array of roster objects
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Expected array of roster items' });
        }

        const results = [];
        for (const item of items) {
            const { rows } = await pool.query(
                `INSERT INTO roster (team, player_name, inning, status, runs_scored, balls_faced, fours_count, sixes_count, runs_conceded, balls_bowled, wickets_taken, dismissal_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                [
                    item.team, item.player_name, item.inning || 1, item.status || 'dugout',
                    item.runs_scored || 0, item.balls_faced || 0, item.fours_count || 0, item.sixes_count || 0,
                    item.runs_conceded || 0, item.balls_bowled || 0, item.wickets_taken || 0, item.dismissal_text || ''
                ]
            );
            results.push(rows[0]);
        }

        await cacheInvalidate('roster');
        broadcastSSE('roster_update', results);
        res.status(201).json(results);
    } catch (err) {
        console.error('POST /api/roster error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update roster entry (by player_name + team + inning)
app.put('/api/roster', async (req, res) => {
    try {
        const { player_name, team, inning, ...updates } = req.body;

        if (!player_name || !team) {
            return res.status(400).json({ error: 'player_name and team are required' });
        }

        const updateKeys = Object.keys(updates);
        if (updateKeys.length === 0) {
            return res.status(400).json({ error: 'No update fields provided' });
        }

        const setClause = updateKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        const values = [...Object.values(updates), player_name, team, inning || 1];

        const { rows } = await pool.query(
            `UPDATE roster SET ${setClause} WHERE player_name = $${updateKeys.length + 1} AND team = $${updateKeys.length + 2} AND inning = $${updateKeys.length + 3} RETURNING *`,
            values
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Roster entry not found' });

        await cacheInvalidate('roster');
        broadcastSSE('roster_update', rows[0]);
        res.json(rows[0]);
    } catch (err) {
        console.error('PUT /api/roster error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT bulk update roster entries (update multiple players at once)
app.put('/api/roster/bulk', async (req, res) => {
    try {
        const items = req.body; // Array of { player_name, team, inning, ...updates }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Expected array of roster updates' });
        }

        const results = [];
        for (const item of items) {
            const { player_name, team, inning, ...updates } = item;
            const updateKeys = Object.keys(updates);
            if (updateKeys.length === 0) continue;

            const setClause = updateKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
            const values = [...Object.values(updates), player_name, team, inning || 1];

            const { rows } = await pool.query(
                `UPDATE roster SET ${setClause} WHERE player_name = $${updateKeys.length + 1} AND team = $${updateKeys.length + 2} AND inning = $${updateKeys.length + 3} RETURNING *`,
                values
            );
            if (rows.length > 0) results.push(rows[0]);
        }

        await cacheInvalidate('roster');
        broadcastSSE('roster_update', results);
        res.json(results);
    } catch (err) {
        console.error('PUT /api/roster/bulk error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE all roster entries
app.delete('/api/roster', async (req, res) => {
    try {
        await pool.query('DELETE FROM roster');
        await cacheInvalidate('roster');
        broadcastSSE('roster_clear', {});
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/roster error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT reset all roster stats (keeps players but zeros stats)
app.put('/api/roster/reset-all', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `UPDATE roster SET
        runs_scored = 0, balls_faced = 0, runs_conceded = 0, balls_bowled = 0, wickets_taken = 0,
        fours_count = 0, sixes_count = 0, dismissal_text = '', status = 'dugout', batting_position = NULL
       RETURNING *`
        );

        await cacheInvalidate('roster');
        broadcastSSE('roster_update', rows);
        res.json(rows);
    } catch (err) {
        console.error('PUT /api/roster/reset-all error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET roster query — get specific player or filtered by team/inning
app.get('/api/roster/query', async (req, res) => {
    try {
        const { player_name, team, inning, order_by, limit } = req.query;
        let query = 'SELECT * FROM roster WHERE 1=1';
        const params = [];
        let paramIdx = 1;

        if (player_name) { query += ` AND player_name = $${paramIdx++}`; params.push(player_name); }
        if (team) { query += ` AND team = $${paramIdx++}`; params.push(team); }
        if (inning) { query += ` AND inning = $${paramIdx++}`; params.push(parseInt(inning)); }

        // Allow filtering for non-null batting_position
        if (req.query.batting_position_not_null === 'true') {
            query += ' AND batting_position IS NOT NULL';
        }

        if (order_by) {
            // Allow ordering; sanitize field name
            const allowed = ['batting_position', 'id', 'player_name', 'runs_scored', 'balls_faced', 'wickets_taken'];
            const [field, dir] = order_by.split(':');
            if (allowed.includes(field)) {
                query += ` ORDER BY ${field} ${dir === 'asc' ? 'ASC' : 'DESC'}`;
            }
        } else {
            query += ' ORDER BY id';
        }

        if (limit) {
            query += ` LIMIT $${paramIdx++}`;
            params.push(parseInt(limit));
        }

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/roster/query error:', err);
        res.status(500).json({ error: err.message });
    }
});


// ══════════════════════════════════════════════════════════════
// AUTH ROUTE
// ══════════════════════════════════════════════════════════════

app.post('/api/auth/verify', (req, res) => {
    const { password } = req.body;
    const expected = process.env.ADMIN_PASSWORD || 'admin123';
    if (password === expected) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Incorrect password' });
    }
});


// ══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════════

app.get('/health', async (req, res) => {
    let dbStatus = 'disconnected';
    let cacheStatus = 'disconnected';

    try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
    } catch { /* ignore */ }

    try {
        if (redisReady) {
            await redisClient.ping();
            cacheStatus = 'connected';
        }
    } catch { /* ignore */ }

    res.json({
        status: dbStatus === 'connected' ? 'ok' : 'degraded',
        database: dbStatus,
        cache: cacheStatus,
        uptime: process.uptime(),
    });
});


// ── Start Server ─────────────────────────────────────────────
async function start() {
    await initRedis();
    app.listen(PORT, () => {
        console.log(`Cricket Backend API running on port ${PORT}`);
    });
}

start().catch(console.error);
