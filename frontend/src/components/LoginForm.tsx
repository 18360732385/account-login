import { useState, type FormEvent } from 'react'

export interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>
  onSwitchToRegister?: () => void
  disabled?: boolean
  error?: string | null
}

export function LoginForm({
  onSubmit,
  onSwitchToRegister,
  disabled = false,
  error = null,
}: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!username.trim() || !password) {
      setLocalError('请输入用户名和密码')
      return
    }
    await onSubmit(username.trim(), password)
  }

  const shownError = localError ?? error

  return (
    <form className="card login-form" onSubmit={handleSubmit} noValidate>
      <h1>账号登录</h1>
      <p className="hint">account-login 单体仓 · 演示账号 demo / demo123</p>

      <label htmlFor="username">用户名</label>
      <input
        id="username"
        name="username"
        autoComplete="username"
        value={username}
        disabled={disabled}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label htmlFor="password">密码</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        disabled={disabled}
        onChange={(e) => setPassword(e.target.value)}
      />

      {shownError ? (
        <p className="error" role="alert">
          {shownError}
        </p>
      ) : null}

      <button type="submit" disabled={disabled}>
        {disabled ? '登录中…' : '登录'}
      </button>

      {onSwitchToRegister ? (
        <p className="switch-auth">
          没有账号？{' '}
          <button
            type="button"
            className="linkish"
            onClick={onSwitchToRegister}
            disabled={disabled}
            data-testid="goto-register"
          >
            去注册
          </button>
        </p>
      ) : null}
    </form>
  )
}
