import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { backend, friendlyError, type Todo } from './backend'
import './App.css'

type User = { id: string; email: string; name?: string }

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    backend()
      .auth.getSession()
      .then(({ data }) => setUser((data?.session?.user as User) ?? null))
      .finally(() => setChecking(false))
  }, [])

  return (
    <main className="todo-app">
      <h1>Todos</h1>
      {checking ? (
        <p>Checking sign-in…</p>
      ) : user ? (
        <TodoList user={user} onSignOut={() => setUser(null)} />
      ) : (
        <SignIn onSignedIn={setUser} />
      )}
    </main>
  )
}

function SignIn({ onSignedIn }: { onSignedIn: (u: User) => void }) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const auth = backend().auth
    if (mode === 'signUp') {
      const r = await auth.signUp.email({ email, password, name: email.split('@')[0] })
      if (r.error) {
        setError(friendlyError(r.error))
        setBusy(false)
        return
      }
    }
    const { error: signInError } = await auth.signIn.email({ email, password })
    if (signInError) {
      setError(friendlyError(signInError))
      setBusy(false)
      return
    }
    const { data } = await auth.getSession()
    setBusy(false)
    if (data?.session?.user) onSignedIn(data.session.user as User)
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{mode === 'signIn' ? 'Sign in' : 'Create an account'}</h2>
      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>
        {mode === 'signIn' ? 'Sign in' : 'Sign up'}
      </button>
      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn')
          setError('')
        }}
      >
        {mode === 'signIn' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
      </button>
    </form>
  )
}

function TodoList({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await backend()
      .from('todos')
      .select('id, title, completed, created_at')
      .order('created_at', { ascending: true })
    setLoading(false)
    if (error) return setError(friendlyError(error))
    setTodos((data as Todo[]) ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function add(e: FormEvent) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    const { data, error } = await backend().from('todos').insert({ title: text }).select()
    if (error) return setError(friendlyError(error))
    setTitle('')
    setError('')
    setTodos((t) => [...t, ...((data as Todo[]) ?? [])])
  }

  async function toggle(todo: Todo) {
    const { error } = await backend()
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id)
    if (error) return setError(friendlyError(error))
    setTodos((t) => t.map((x) => (x.id === todo.id ? { ...x, completed: !x.completed } : x)))
  }

  async function remove(todo: Todo) {
    const { error } = await backend().from('todos').delete().eq('id', todo.id)
    if (error) return setError(friendlyError(error))
    setTodos((t) => t.filter((x) => x.id !== todo.id))
  }

  async function signOut() {
    await backend().auth.signOut()
    onSignOut()
  }

  return (
    <section className="card">
      <div className="row">
        <span>Signed in as {user.email}</span>
        <button className="link" onClick={signOut}>
          Sign out
        </button>
      </div>
      <form className="row" onSubmit={add}>
        <input
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : todos.length === 0 ? (
        <p>No todos yet.</p>
      ) : (
        <ul className="todos">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={todo.completed} onChange={() => toggle(todo)} />
                <span>{todo.title}</span>
              </label>
              <button className="link" aria-label={`Delete ${todo.title}`} onClick={() => remove(todo)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default App
