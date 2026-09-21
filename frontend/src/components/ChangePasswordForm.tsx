import { useState, type FormEvent } from 'react'

export interface ChangePasswordFormProps {
  onSubmit: (oldPassword: string, newPassword: string) => Promise<void>
  disabled?: boolean
  error?: string | null
}

export function ChangePasswordForm({
  onSubmit,
  disabled = false,
  error = null,
}: ChangePasswordFormProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!oldPassword || !newPassword) {
      setLocalError('请填写旧密码与新密码')
      return
    }
    if (newPassword.length < 6) {
      setLocalError('新密码至少 6 位')
      return
    }
    if (oldPassword === newPassword) {
      setLocalError('新密码不能与旧密码相同')
      return
    }
    await onSubmit(oldPassword, newPassword)
  }

  const shownError = localError ?? error

  return (
    <form
      className="change-password-form"
      onSubmit={handleSubmit}
      noValidate
      data-testid="change-password-form"
    >
      <h2>修改密码</h2>
      <p className="hint">需验证旧密码；成功后需重新登录</p>

      <label htmlFor="oldPassword">旧密码</label>
      <input
        id="oldPassword"
        name="oldPassword"
        type="password"
        autoComplete="current-password"
        value={oldPassword}
        disabled={disabled}
        onChange={(e) => setOldPassword(e.target.value)}
      />

      <label htmlFor="newPassword">新密码</label>
      <input
        id="newPassword"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        disabled={disabled}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      {shownError ? (
        <p className="error" role="alert" data-testid="change-password-error">
          {shownError}
        </p>
      ) : null}

      <button type="submit" disabled={disabled}>
        {disabled ? '提交中…' : '确认改密'}
      </button>
    </form>
  )
}
