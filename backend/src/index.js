const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const client = require('prom-client')
require('dotenv').config()

const app = express()

// ─── CORS restrictif (correction SonarCloud) ─────────────────────
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '10kb' }))

// ─── Prometheus ───────────────────────────────────────────────────
client.collectDefaultMetrics()

app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType)
        res.end(await client.register.metrics())
    } catch (err) {
        res.status(500).end(err)
    }
})

// ─── Base de données ─────────────────────────────────────────────
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'todo_user',
    password: process.env.DB_PASSWORD || 'todo_pass',
    database: process.env.DB_NAME || 'todo_db',
})

pool.query('SELECT NOW()', (err) => {
    if (err) console.error('Connexion BDD échouée :', err.message)
    else console.log('Connexion BDD réussie !')
})

// ─── Validation des inputs ────────────────────────────────────────
function validateText(text) {
    if (!text || typeof text !== 'string') return false
    if (text.trim().length === 0) return false
    if (text.length > 500) return false
    return true
}

function validateId(id) {
    const parsed = parseInt(id, 10)
    return !isNaN(parsed) && parsed > 0
}

// ─── Routes ──────────────────────────────────────────────────────
app.get('/api/todos', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, text, done, created_at FROM todos ORDER BY created_at DESC'
        )
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

app.post('/api/todos', async (req, res) => {
    try {
        const { text } = req.body
        if (!validateText(text)) {
            return res.status(400).json({ error: 'Texte invalide' })
        }
        const result = await pool.query(
            'INSERT INTO todos (text) VALUES ($1) RETURNING id, text, done, created_at',
            [text.trim()]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

app.patch('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params
        if (!validateId(id)) {
            return res.status(400).json({ error: 'ID invalide' })
        }
        const result = await pool.query(
            'UPDATE todos SET done = NOT done WHERE id = $1 RETURNING id, text, done, created_at',
            [parseInt(id, 10)]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Todo non trouvé' })
        }
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params
        if (!validateId(id)) {
            return res.status(400).json({ error: 'ID invalide' })
        }
        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 RETURNING id',
            [parseInt(id, 10)]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Todo non trouvé' })
        }
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ─── Démarrage ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))