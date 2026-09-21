import type { LoginResponse, MeResponse } from '../api/types'
import { ChangePasswordForm } from './ChangePasswordForm'

export interface ProfileViewProps {
  me: MeResponse
  token: LoginResponse
  onLogout: () => void
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>
  logoutBusy?: boolean
  changeBusy?: boolean
  changeError?: string | null
}

function shortToken(token: string): string {
  if (token.length <= 24) return token
  return `${token.slice(0, 12)}…${token.slice(-8)}`
}

export function ProfileView({
  me,
  token,
  onLogout,
  onChangePassword,
  logoutBusy = false,
  changeBusy = false,
  changeError = null,
}: ProfileViewProps) {
  return (
    <section className="card profile" aria-live="polite">
      <h1>当前用户</h1>
      <dl>
        <dt>用户名</dt>
        <dd data-testid="me-username">{me.username}</dd>
        <dt>显示名</dt>
        <dd data-testid="me-displayName">{me.displayName}</dd>
        <dt>Token 类型</dt>
        <dd>{token.tokenType}</dd>
        <dt>Token（截断）</dt>
        <dd data-testid="token-short" className="mono">
          {shortToken(token.accessToken)}
        </dd>
        <dt>过期（ms）</dt>
        <dd>{token.expiresInMs}</dd>
      </dl>

      <button
        type="button"
        onClick={onLogout}
        disabled={logoutBusy || changeBusy}
        data-testid="logout-button"
      >
        {logoutBusy ? '退出中…' : '退出登录'}
      </button>

      <hr className="divider" />

      <ChangePasswordForm
        onSubmit={onChangePassword}
        disabled={logoutBusy || changeBusy}
        error={changeError}
      />
    </section>
  )
}
