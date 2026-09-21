import { useState, type FormEvent } from 'react'

export interface RegisterFormProps {
  onSubmit: (username: string, password: string) => Promise<void>
  onSwitchToLogin: () => void
  disabled?: boolean
  error?: string | null
}

export function RegisterForm({
  onSubmit,
  onSwitchToLogin,
  disabled = false,
  error = null,
}: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    const u = username.trim()
    if (!u || !password) {
      setLocalError('请输入用户名和密码')
      return
    }
    if (u.length < 3) {
      setLocalError('用户名至少 3 个字符')
      return
    }
    if (password.length < 6) {
      setLocalError('密码至少 6 位')
      return
    }
    await onSubmit(u, password)
  }

  const shownError = localError ?? error

  return (
    <form className="card login-form" onSubmit={handleSubmit} noValidate data-testid="register-form">
      <h1>用户注册</h1>
      <p className="hint">创建成功后直接登录 · 密码至少 6 位</p>

      <label htmlFor="reg-username">用户名</label>
      <input
        id="reg-username"
        name="username"
        autoComplete="username"
        value={username}
        disabled={disabled}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label htmlFor="reg-password">密码</label>
      <input
        id="reg-password"
        name="password"
        type="password"
        autoComplete="new-password"
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
        {disabled ? '注册中…' : '注册'}
      </button>

      <p className="switch-auth">
        已有账号？{' '}
        <button type="button" className="linkish" onClick={onSwitchToLogin} disabled={disabled}>
          去登录
        </button>
      </p>
    </form>
  )
}
