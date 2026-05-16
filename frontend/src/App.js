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
    <div className="min-h-screen bg-bauhaus-canvas font-outfit">
      <main className="mx-auto max-w-lg px-5 py-10 sm:py-14">
        <header className="border-b-4 border-black pb-6">
          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tighter text-bauhaus-fg sm:text-5xl">
            Todo
          </h1>
        </header>

        <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch" onSubmit={handleAdd}>
          <label htmlFor="task-title" className="sr-only">
            Task title
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task…"
            maxLength={255}
            aria-label="Task title"
            disabled={saving}
            className="min-h-[3rem] flex-1 border-2 border-black bg-white px-3 py-2 text-base font-medium text-bauhaus-fg placeholder:text-bauhaus-fg/40 focus:border-black focus:outline-none focus:ring-2 focus:ring-bauhaus-blue focus:ring-offset-2 disabled:opacity-60 sm:border-[3px] lg:border-4"
          />
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="min-h-[3rem] shrink-0 border-2 border-black bg-bauhaus-blue px-6 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-hard transition duration-200 ease-out hover:bg-bauhaus-blue/90 disabled:cursor-not-allowed disabled:opacity-50 enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-none sm:border-[3px] lg:border-4 lg:shadow-hard-lg"
          >
            {saving ? 'Adding…' : 'Add'}
          </button>
        </form>

        {error && (
          <div
            className="mt-4 border-2 border-black bg-bauhaus-red/15 px-3 py-2 text-sm font-bold text-bauhaus-fg shadow-hard-sm sm:border-[3px] lg:border-4"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-sm font-medium text-bauhaus-fg/70">Loading tasks…</p>
          ) : todos.length === 0 ? (
            <p className="text-sm font-medium text-bauhaus-fg/70">No tasks yet. Add one above.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`flex items-center justify-between gap-3 border-2 border-black px-3 py-3 shadow-hard transition duration-200 ease-out sm:border-[3px] lg:border-4 lg:shadow-hard-lg ${
                    todo.completed ? 'bg-bauhaus-muted/80' : 'bg-white hover:-translate-y-0.5'
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 focus-within:outline-none focus-within:ring-2 focus-within:ring-bauhaus-blue focus-within:ring-offset-2">
                    <input
                      type="checkbox"
                      checked={!!todo.completed}
                      onChange={() => toggleCompleted(todo)}
                      className="h-5 w-5 shrink-0 cursor-pointer rounded-none border-2 border-black accent-bauhaus-yellow"
                    />
                    <span
                      className={`min-w-0 flex-1 break-words text-base font-medium leading-snug ${
                        todo.completed ? 'text-bauhaus-fg/50 line-through' : 'text-bauhaus-fg'
                      }`}
                    >
                      {todo.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeTodo(todo.id)}
                    aria-label={`Delete ${todo.title}`}
                    className="shrink-0 border-2 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-bauhaus-fg shadow-hard-sm transition duration-200 ease-out hover:bg-bauhaus-red/15 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:border-[3px] lg:border-4"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
