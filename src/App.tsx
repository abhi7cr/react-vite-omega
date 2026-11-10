import { useEffect, useState, type FormEvent } from 'react'
import {
  backend,
  friendlyError,
  isWebUrl,
  type Bookmark,
  type Contact,
  type Expense,
  type Habit,
  type Quote,
  type Book,
  type Recipe,
  type Movie,
  type Note,
  type Todo,
} from './backend'
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
        <>
          <TodoList user={user} onSignOut={() => setUser(null)} />
          <Notes />
          <Bookmarks />
          <Contacts />
          <Expenses />
          <Habits />
          <Quotes />
          <Books />
          <Recipes />
          <Movies />
        </>
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

  useEffect(() => {
    backend()
      .from('todos')
      .select('id, title, completed, created_at')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setTodos((data as Todo[]) ?? [])
      })
  }, [])

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

function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('notes')
      .select('id, body, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setNotes((data as Note[]) ?? [])
      })
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    const { data, error } = await backend().from('notes').insert({ body: text }).select()
    if (error) return setError(friendlyError(error))
    setBody('')
    setError('')
    setNotes((n) => [...((data as Note[]) ?? []), ...n])
  }

  async function remove(note: Note) {
    const { error } = await backend().from('notes').delete().eq('id', note.id)
    if (error) return setError(friendlyError(error))
    setNotes((n) => n.filter((x) => x.id !== note.id))
  }

  return (
    <section className="card notes">
      <h2>Notes</h2>
      <form className="row" onSubmit={add}>
        <input placeholder="Write a note" value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="submit">Save</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : notes.length === 0 ? (
        <p>No notes yet.</p>
      ) : (
        <ul className="todos">
          {notes.map((note) => (
            <li key={note.id}>
              <span>{note.body}</span>
              <button className="link" aria-label="Delete note" onClick={() => remove(note)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('bookmarks')
      .select('id, title, url, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setBookmarks((data as Bookmark[]) ?? [])
      })
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    const link = url.trim()
    if (!isWebUrl(link)) return setError('Enter a link that starts with http:// or https://.')
    const { data, error } = await backend()
      .from('bookmarks')
      .insert({ title: title.trim() || link, url: link })
      .select()
    if (error) return setError(friendlyError(error))
    setTitle('')
    setUrl('')
    setError('')
    setBookmarks((b) => [...((data as Bookmark[]) ?? []), ...b])
  }

  async function remove(bookmark: Bookmark) {
    const { error } = await backend().from('bookmarks').delete().eq('id', bookmark.id)
    if (error) return setError(friendlyError(error))
    setBookmarks((b) => b.filter((x) => x.id !== bookmark.id))
  }

  return (
    <section className="card notes">
      <h2>Bookmarks</h2>
      <form className="row" onSubmit={add}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit">Save</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : bookmarks.length === 0 ? (
        <p>No bookmarks yet.</p>
      ) : (
        <ul className="todos">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id}>
              {isWebUrl(bookmark.url) ? (
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                  {bookmark.title}
                </a>
              ) : (
                <span>{bookmark.title}</span>
              )}
              <button
                className="link"
                aria-label={`Delete ${bookmark.title}`}
                onClick={() => remove(bookmark)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('contacts')
      .select('id, name, email, created_at')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setContacts((data as Contact[]) ?? [])
      })
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const { data, error } = await backend()
      .from('contacts')
      .insert({ name: trimmed, email: email.trim() || null })
      .select()
    if (error) return setError(friendlyError(error))
    setName('')
    setEmail('')
    setError('')
    setContacts((c) =>
      [...c, ...((data as Contact[]) ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    )
  }

  async function remove(contact: Contact) {
    const { error } = await backend().from('contacts').delete().eq('id', contact.id)
    if (error) return setError(friendlyError(error))
    setContacts((c) => c.filter((x) => x.id !== contact.id))
  }

  return (
    <section className="card notes">
      <h2>Contacts</h2>
      <form className="row" onSubmit={add}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Save</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : contacts.length === 0 ? (
        <p>No contacts yet.</p>
      ) : (
        <ul className="todos">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <span>
                {contact.name}
                {contact.email && <> · {contact.email}</>}
              </span>
              <button
                className="link"
                aria-label={`Delete ${contact.name}`}
                onClick={() => remove(contact)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })

function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('expenses')
      .select('id, description, amount, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setExpenses((data as Expense[]) ?? [])
      })
  }, [])

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  async function add(e: FormEvent) {
    e.preventDefault()
    const text = description.trim()
    const value = Number(amount)
    if (!text) return
    if (!Number.isFinite(value) || value < 0) return setError('Enter an amount of 0 or more.')
    const { data, error } = await backend()
      .from('expenses')
      .insert({ description: text, amount: Math.round(value * 100) / 100 })
      .select()
    if (error) return setError(friendlyError(error))
    setDescription('')
    setAmount('')
    setError('')
    setExpenses((x) => [...((data as Expense[]) ?? []), ...x])
  }

  async function remove(expense: Expense) {
    const { error } = await backend().from('expenses').delete().eq('id', expense.id)
    if (error) return setError(friendlyError(error))
    setExpenses((x) => x.filter((e) => e.id !== expense.id))
  }

  return (
    <section className="card notes">
      <div className="row">
        <h2>Expenses</h2>
        <strong>Total: {currency.format(total)}</strong>
      </div>
      <form className="row" onSubmit={add}>
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : expenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <ul className="todos">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <span>
                {expense.description} · {currency.format(Number(expense.amount))}
              </span>
              <button
                className="link"
                aria-label={`Delete ${expense.description}`}
                onClick={() => remove(expense)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('habits')
      .select('id, name, check_ins, created_at')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setHabits((data as Habit[]) ?? [])
      })
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    const text = name.trim()
    if (!text) return
    const { data, error } = await backend().from('habits').insert({ name: text }).select()
    if (error) return setError(friendlyError(error))
    setName('')
    setError('')
    setHabits((h) => [...h, ...((data as Habit[]) ?? [])])
  }

  async function checkIn(habit: Habit) {
    const { data, error } = await backend()
      .from('habits')
      .update({ check_ins: habit.check_ins + 1 })
      .eq('id', habit.id)
      .select()
    if (error) return setError(friendlyError(error))
    const updated = (data as Habit[] | null)?.[0]
    if (updated) setHabits((h) => h.map((x) => (x.id === habit.id ? updated : x)))
  }

  async function remove(habit: Habit) {
    const { error } = await backend().from('habits').delete().eq('id', habit.id)
    if (error) return setError(friendlyError(error))
    setHabits((h) => h.filter((x) => x.id !== habit.id))
  }

  return (
    <section className="card notes">
      <h2>Habits</h2>
      <form className="row" onSubmit={add}>
        <input placeholder="New habit" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : habits.length === 0 ? (
        <p>No habits yet.</p>
      ) : (
        <ul className="todos">
          {habits.map((habit) => (
            <li key={habit.id}>
              <span>
                {habit.name} · {habit.check_ins} {habit.check_ins === 1 ? 'check-in' : 'check-ins'}
              </span>
              <span>
                <button className="link" onClick={() => checkIn(habit)}>
                  Check in
                </button>
                <button
                  className="link"
                  aria-label={`Delete ${habit.name}`}
                  onClick={() => remove(habit)}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('quotes')
      .select('id, body, author, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setQuotes((data as Quote[]) ?? [])
      })
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    const { data, error } = await backend()
      .from('quotes')
      .insert({ body: text, author: author.trim() || null })
      .select()
    if (error) return setError(friendlyError(error))
    setBody('')
    setAuthor('')
    setError('')
    setQuotes((q) => [...((data as Quote[]) ?? []), ...q])
  }

  async function remove(quote: Quote) {
    const { error } = await backend().from('quotes').delete().eq('id', quote.id)
    if (error) return setError(friendlyError(error))
    setQuotes((q) => q.filter((x) => x.id !== quote.id))
  }

  return (
    <section className="card notes">
      <h2>Quotes</h2>
      <form className="row" onSubmit={add}>
        <input placeholder="Quote" value={body} onChange={(e) => setBody(e.target.value)} required />
        <input
          placeholder="Author (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <button type="submit">Save</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : quotes.length === 0 ? (
        <p>No quotes yet.</p>
      ) : (
        <ul className="todos">
          {quotes.map((quote) => (
            <li key={quote.id}>
              <span>
                “{quote.body}”{quote.author && <> — {quote.author}</>}
              </span>
              <button className="link" aria-label="Delete quote" onClick={() => remove(quote)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Books() {
  const [books, setBooks] = useState<Book[]>([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('books')
      .select('id, title, author, is_read, created_at')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setBooks((data as Book[]) ?? [])
      })
  }, [])

  const readCount = books.filter((b) => b.is_read).length

  async function add(e: FormEvent) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    const { data, error } = await backend()
      .from('books')
      .insert({ title: text, author: author.trim() || null })
      .select()
    if (error) return setError(friendlyError(error))
    setTitle('')
    setAuthor('')
    setError('')
    setBooks((b) => [...b, ...((data as Book[]) ?? [])])
  }

  async function toggle(book: Book) {
    const { error } = await backend()
      .from('books')
      .update({ is_read: !book.is_read })
      .eq('id', book.id)
    if (error) return setError(friendlyError(error))
    setBooks((b) => b.map((x) => (x.id === book.id ? { ...x, is_read: !x.is_read } : x)))
  }

  async function remove(book: Book) {
    const { error } = await backend().from('books').delete().eq('id', book.id)
    if (error) return setError(friendlyError(error))
    setBooks((b) => b.filter((x) => x.id !== book.id))
  }

  return (
    <section className="card notes">
      <div className="row">
        <h2>Reading list</h2>
        <span>
          {readCount} of {books.length} read
        </span>
      </div>
      <form className="row" onSubmit={add}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input
          placeholder="Author (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : books.length === 0 ? (
        <p>No books yet.</p>
      ) : (
        <ul className="todos">
          {books.map((book) => (
            <li key={book.id} className={book.is_read ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={book.is_read} onChange={() => toggle(book)} />
                <span>
                  {book.title}
                  {book.author && <> · {book.author}</>}
                </span>
              </label>
              <button
                className="link"
                aria-label={`Delete ${book.title}`}
                onClick={() => remove(book)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('recipes')
      .select('id, name, prep_minutes, created_at')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setRecipes((data as Recipe[]) ?? [])
      })
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    const text = name.trim()
    if (!text) return
    const prep = minutes.trim() ? Number(minutes) : null
    if (prep !== null && (!Number.isInteger(prep) || prep <= 0)) {
      return setError('Enter the prep time as a whole number of minutes.')
    }
    const { data, error } = await backend()
      .from('recipes')
      .insert({ name: text, prep_minutes: prep })
      .select()
    if (error) return setError(friendlyError(error))
    setName('')
    setMinutes('')
    setError('')
    setRecipes((r) =>
      [...r, ...((data as Recipe[]) ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    )
  }

  async function remove(recipe: Recipe) {
    const { error } = await backend().from('recipes').delete().eq('id', recipe.id)
    if (error) return setError(friendlyError(error))
    setRecipes((r) => r.filter((x) => x.id !== recipe.id))
  }

  return (
    <section className="card notes">
      <h2>Recipes</h2>
      <form className="row" onSubmit={add}>
        <input placeholder="Recipe name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          type="number"
          placeholder="Prep minutes"
          min="1"
          step="1"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <button type="submit">Save</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : recipes.length === 0 ? (
        <p>No recipes yet.</p>
      ) : (
        <ul className="todos">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <span>
                {recipe.name}
                {recipe.prep_minutes !== null && <> · {recipe.prep_minutes} min</>}
              </span>
              <button
                className="link"
                aria-label={`Delete ${recipe.name}`}
                onClick={() => remove(recipe)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    backend()
      .from('movies')
      .select('id, title, rating, created_at')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (error) return setError(friendlyError(error))
        setMovies((data as Movie[]) ?? [])
      })
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    const { data, error } = await backend().from('movies').insert({ title: text }).select()
    if (error) return setError(friendlyError(error))
    setTitle('')
    setError('')
    setMovies((m) => [...m, ...((data as Movie[]) ?? [])])
  }

  async function rate(movie: Movie, rating: number) {
    // Clicking the current rating clears it.
    const next = movie.rating === rating ? null : rating
    const { error } = await backend().from('movies').update({ rating: next }).eq('id', movie.id)
    if (error) return setError(friendlyError(error))
    setMovies((m) => m.map((x) => (x.id === movie.id ? { ...x, rating: next } : x)))
  }

  async function remove(movie: Movie) {
    const { error } = await backend().from('movies').delete().eq('id', movie.id)
    if (error) return setError(friendlyError(error))
    setMovies((m) => m.filter((x) => x.id !== movie.id))
  }

  return (
    <section className="card notes">
      <h2>Movies</h2>
      <form className="row" onSubmit={add}>
        <input placeholder="Movie title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : movies.length === 0 ? (
        <p>No movies yet.</p>
      ) : (
        <ul className="todos">
          {movies.map((movie) => (
            <li key={movie.id}>
              <span>{movie.title}</span>
              <span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="link"
                    aria-label={`Rate ${movie.title} ${star} of 5`}
                    aria-pressed={movie.rating === star}
                    onClick={() => rate(movie, star)}
                  >
                    {movie.rating !== null && star <= movie.rating ? '★' : '☆'}
                  </button>
                ))}
                <button
                  className="link"
                  aria-label={`Delete ${movie.title}`}
                  onClick={() => remove(movie)}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
