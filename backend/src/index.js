const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()


const app = express()
app.use(cors())
app.use(express.json())

const client = require('prom-client')

// Métriques automatiques (CPU, mémoire, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics
collectDefaultMetrics()

// Endpoint métriques pour Prometheus
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType)
    res.end(await client.register.metrics())
})
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'todo_user',
    password: process.env.DB_PASSWORD || 'todo_pass',
    database: process.env.DB_NAME || 'todo_db',
})

// Tester la connexion BDD au démarrage
pool.query('SELECT NOW()', (err) => {
    if (err) console.error('❌ Connexion BDD échouée :', err.message)
    else console.log('✅ Connexion BDD réussie !')
})

// GET tous les todos
app.get('/api/todos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC')
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST nouveau todo
app.post('/api/todos', async (req, res) => {
    try {
        const { text } = req.body
        const result = await pool.query(
            'INSERT INTO todos (text) VALUES ($1) RETURNING *',
            [text]
        )
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PATCH toggle done
app.patch('/api/todos/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE todos SET done = NOT done WHERE id = $1 RETURNING *',
            [req.params.id]
        )
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id])
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`))