import { createClient } from '@aws-amplifygen3/backend-client-js'

export type Todo = {
  id: number
  title: string
  completed: boolean
  created_at: string
}

export type Note = {
  id: number
  body: string
  created_at: string
}

export type Workout = {
  id: number
  activity: string
  minutes: number
  created_at: string
}

export type Movie = {
  id: number
  title: string
  rating: number | null
  created_at: string
}

export type Recipe = {
  id: number
  name: string
  prep_minutes: number | null
  created_at: string
}

export type Book = {
  id: number
  title: string
  author: string | null
  is_read: boolean
  created_at: string
}

export type Quote = {
  id: number
  body: string
  author: string | null
  created_at: string
}

export type Habit = {
  id: number
  name: string
  check_ins: number
  created_at: string
}

export type Expense = {
  id: number
  description: string
  // Postgres numeric comes back from the Data API as a string or number.
  amount: number | string
  created_at: string
}

export type Contact = {
  id: number
  name: string
  email: string | null
  created_at: string
}

export type Bookmark = {
  id: number
  title: string
  url: string
  created_at: string
}

// Only http(s) links are rendered, so a stored "javascript:" URL can't run script.
export function isWebUrl(value: string) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createClient<any>> | undefined

export function backend() {
  if (!client) {
    const url = import.meta.env.AMPLIFY_BACKEND_URL
    const key = import.meta.env.AMPLIFY_BACKEND_PUBLISHABLE_KEY
    client = createClient(url, key)
  }
  return client
}

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'That email and password do not match.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with that email already exists.',
  PASSWORD_TOO_SHORT: 'Use a password of at least 8 characters.',
  '42501': 'You are not allowed to do that. Try signing in again.',
  PGRST205: 'That table is not available yet.',
}

export function friendlyError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return ''
  if (error.message) console.error(error)
  return (error.code && messages[error.code]) || 'Something went wrong. Please try again.'
}
