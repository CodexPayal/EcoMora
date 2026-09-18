import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth, AuthUser } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Register → get UserPublic back
      const { data: userPublic } = await client.post<AuthUser>('/auth/register', {
        username,
        email,
        password,
      })

      // Auto-login after registration
      const { data: tokenData } = await client.post<{
        access_token: string
        token_type: string
      }>('/auth/login', { email, password })

      login(tokenData.access_token, userPublic)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Registration failed. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-earth-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-earth-200">
        {/* Logo / heading */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-forest-700">EcoMora 🌿</h1>
          <p className="mt-1 text-sm text-earth-500">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-earth-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-earth-300 px-3 py-2 text-sm
                         focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-earth-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-earth-300 px-3 py-2 text-sm
                         focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-earth-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-earth-300 px-3 py-2 text-sm
                         focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-forest-600 px-4 py-2 text-sm font-semibold
                       text-white hover:bg-forest-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-earth-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-forest-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
