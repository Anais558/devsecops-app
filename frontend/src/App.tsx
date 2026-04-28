import { useState, useEffect, useCallback } from 'react'
import type { KeyboardEvent } from 'react'

const ALLOWED_API = 'http://localhost:3001/api'

function getSafeApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl || typeof envUrl !== 'string') return ALLOWED_API
  try {
    const parsed = new URL(envUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ALLOWED_API
    return envUrl
  } catch {
    return ALLOWED_API
  }
}

const API = getSafeApiUrl()

interface Todo {
  id: number
  text: string
  done: boolean
}

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
  return res
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [text, setText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const loadTodos = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/todos`)
      const data: Todo[] = await res.json()
      setTodos(data)
    } catch {
      setError('Impossible de charger les tâches')
    }
  }, [])

  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  const addTodo = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    try {
      const res = await apiFetch(`${API}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const newTodo: Todo = await res.json()
      setTodos(prev => [newTodo, ...prev])
      setText('')
      setError(null)
    } catch {
      setError('Impossible d\'ajouter la tâche')
    }
  }

  const toggleTodo = async (id: number) => {
    try {
      const res = await apiFetch(`${API}/todos/${id}`, { method: 'PATCH' })
      const updated: Todo = await res.json()
      setTodos(prev => prev.map(t => t.id === id ? updated : t))
    } catch {
      setError('Impossible de modifier la tâche')
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      await apiFetch(`${API}/todos/${id}`, { method: 'DELETE' })
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch {
      setError('Impossible de supprimer la tâche')
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTodo()
  }

  const done = todos.filter(t => t.done).length
  const left = todos.length - done

  return (
    <div style={styles.body}>
      <div style={styles.app}>

        <div style={styles.header}>
          <h1 style={styles.h1}>Mes <em style={styles.em}>tâches</em></h1>
          <p style={styles.subtitle}>DevSecOps Project · Todo App</p>
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            {error}
            <button style={styles.errorClose} onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ajouter une tâche..."
            maxLength={500}
            aria-label="Nouvelle tâche"
          />
          <button style={styles.btnAdd} onClick={addTodo} aria-label="Ajouter">+</button>
        </div>

        <div style={styles.stats}>
          {[
            { label: 'Total',     value: todos.length },
            { label: 'Terminées', value: done },
            { label: 'Restantes', value: left },
          ].map(s => (
            <div key={s.label} style={styles.stat}>
              <span style={styles.statNum}>{s.value}</span>
              {s.label}
            </div>
          ))}
        </div>

        <div style={styles.list}>
          {todos.length === 0 && (
            <p style={styles.empty}>Aucune tâche pour le moment...</p>
          )}
          {todos.map(t => (
            <div key={t.id} style={{ ...styles.item, opacity: t.done ? 0.45 : 1 }}>
              <button
                style={{ ...styles.checkBtn, background: t.done ? '#c8f060' : 'transparent', borderColor: t.done ? '#c8f060' : '#3e3d38' }}
                onClick={() => toggleTodo(t.id)}
                aria-label={t.done ? 'Marquer non terminée' : 'Marquer terminée'}
              >
                {t.done ? '✓' : ''}
              </button>
              <span style={{ ...styles.todoText, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#4a4945' : '#d0cdc6' }}>
                {t.text}
              </span>
              <button
                style={styles.delBtn}
                onClick={() => deleteTodo(t.id)}
                aria-label="Supprimer la tâche"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  body: { minHeight: '100vh', background: '#0f0e0c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: "'DM Sans', sans-serif" },
  app: { width: '100%', maxWidth: 520 },
  header: { marginBottom: '2.5rem' },
  h1: { fontFamily: "'Instrument Serif', serif", fontSize: '2.8rem', fontWeight: 400, color: '#f0ede6', letterSpacing: '-0.02em', lineHeight: 1.1 },
  em: { fontStyle: 'italic', color: '#c8f060' },
  subtitle: { marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b6860', fontWeight: 300, letterSpacing: '0.05em', textTransform: 'uppercase' },
  inputRow: { display: 'flex', gap: 10, marginBottom: '2rem' },
  input: { flex: 1, background: '#1a1916', border: '1px solid #2e2d29', borderRadius: 12, padding: '14px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#f0ede6', outline: 'none' },
  btnAdd: { background: '#c8f060', border: 'none', borderRadius: 12, padding: '14px 22px', fontFamily: "'DM Sans', sans-serif", fontSize: '1.2rem', fontWeight: 500, color: '#0f0e0c', cursor: 'pointer' },
  stats: { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  stat: { background: '#1a1916', border: '1px solid #2e2d29', borderRadius: 10, padding: '10px 16px', fontSize: '0.8rem', color: '#6b6860', textTransform: 'uppercase', letterSpacing: '0.06em' },
  statNum: { display: 'block', fontSize: '1.4rem', fontFamily: "'Instrument Serif', serif", color: '#f0ede6', marginBottom: 2, textTransform: 'none', letterSpacing: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: { display: 'flex', alignItems: 'center', gap: 12, background: '#1a1916', border: '1px solid #2e2d29', borderRadius: 12, padding: '14px 16px' },
  checkBtn: { width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #3e3d38', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, color: '#0f0e0c' },
  todoText: { flex: 1, fontSize: '0.95rem', fontWeight: 300 },
  delBtn: { background: 'transparent', border: 'none', color: '#3e3d38', cursor: 'pointer', fontSize: '1rem', padding: 4, borderRadius: 6 },
  empty: { textAlign: 'center', padding: '3rem 0', color: '#3e3d38', fontSize: '0.9rem', fontStyle: 'italic' },
  errorBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2a0a0a', border: '1px solid #ff6b6b', borderRadius: 10, padding: '10px 16px', marginBottom: '1rem', color: '#ff6b6b', fontSize: '0.9rem' },
  errorClose: { background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem' },
}