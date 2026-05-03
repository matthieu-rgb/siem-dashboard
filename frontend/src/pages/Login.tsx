import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof schema>

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password)
      navigate('/', { replace: true })
    } catch {
      setError('root', { message: 'Invalid credentials' })
    }
  }

  return (
    <div className="min-h-screen bg-bg-canvas flex items-center justify-center">
      <div className="w-[360px] bg-bg-surface border border-border-default rounded-lg p-8">
        <div className="mb-8">
          <div className="w-10 h-10 bg-bg-elevated border border-border-default rounded-lg flex items-center justify-center mb-5">
            <span className="text-fg-default font-mono text-sm font-semibold">SD</span>
          </div>
          <h1 className="text-fg-default text-lg font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="text-fg-muted text-sm mt-1">Lightweight Wazuh interface</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-xs text-fg-muted uppercase tracking-wider mb-1.5"
            >
              Email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              className="w-full bg-bg-elevated border border-border-default rounded-sm px-3 py-1.5 text-sm text-fg-default placeholder:text-fg-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
              placeholder="admin@example.com"
            />
            {errors.email && (
              <p className="text-severity-critical text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs text-fg-muted uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full bg-bg-elevated border border-border-default rounded-sm px-3 py-1.5 text-sm text-fg-default placeholder:text-fg-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
            />
            {errors.password && (
              <p className="text-severity-critical text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-severity-critical text-sm">{errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-accent-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-canvas transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
