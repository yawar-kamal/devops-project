import React, { useCallback, useEffect, useState } from 'react';

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadTodos = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/todos');
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setTodos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load tasks');
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setTitle('');
      setTodos((prev) => [data, ...prev]);
    } catch (e) {
      setError(e.message || 'Could not add task');
    } finally {
      setSaving(false);
    }
  }

  async function toggleCompleted(todo) {
    setError(null);
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setTodos((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } catch (e) {
      setError(e.message || 'Could not update task');
    }
  }

  async function removeTodo(id) {
    setError(null);
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await parseJsonResponse(res);
        throw new Error(data?.error || res.statusText);
      }
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e.message || 'Could not delete task');
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Todo</h1>
        <p className="tagline">React · Express · PostgreSQL — base app for your CI/CD pipeline</p>
      </header>

      <main className="main">
        <form className="add-form" onSubmit={handleAdd}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task…"
            maxLength={255}
            aria-label="Task title"
            disabled={saving}
          />
          <button type="submit" disabled={saving || !title.trim()}>
            {saving ? 'Adding…' : 'Add'}
          </button>
        </form>

        {error && (
          <div className="banner error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="muted">Loading tasks…</p>
        ) : todos.length === 0 ? (
          <p className="muted">No tasks yet. Add one above.</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className={todo.completed ? 'todo done' : 'todo'}>
                <label className="todo-label">
                  <input
                    type="checkbox"
                    checked={!!todo.completed}
                    onChange={() => toggleCompleted(todo)}
                  />
                  <span className="todo-title">{todo.title}</span>
                </label>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => removeTodo(todo.id)}
                  aria-label={`Delete ${todo.title}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
