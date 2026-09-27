import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, fetchProfile, updateProfile } from '../api/client'
import type { UserProfileResponse } from '../api/types'

export interface ProfilePageProps {
  accessToken: string
  /** 资料接口返回 401（未登录 / token 失效）时回调，由 App 清会话并跳转登录页 */
  onUnauthorized: () => void
}

type FieldErrors = { nickname?: string; email?: string }

// 与后端 UserProfileService 同口径
const NICKNAME_MAX = 20
const EMAIL_MAX = 100
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NICKNAME_INVALID = '昵称长度须为 1–20 个字符'
const EMAIL_INVALID = '邮箱格式不正确'
const EMAIL_TAKEN = '该邮箱已被使用'

function validate(nickname: string, email: string): FieldErrors {
  const errors: FieldErrors = {}
  if ([...nickname].length > NICKNAME_MAX) errors.nickname = NICKNAME_INVALID
  if (email && (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email))) errors.email = EMAIL_INVALID
  return errors
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN', { hour12: false })
}

export function ProfilePage({ accessToken, onUnauthorized }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchProfile(accessToken)
      .then((p) => {
        if (cancelled) return
        setProfile(p)
        setNickname(p.nickname ?? '')
        setEmail(p.email ?? '')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized()
          return
        }
        setLoadError(err instanceof Error ? err.message : '加载失败')
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, onUnauthorized])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    setFormError(null)
    const n = nickname.trim()
    const m = email.trim()
    const errors = validate(n, m)
    setFieldErrors(errors)
    if (errors.nickname || errors.email) return

    setSaving(true)
    try {
      const updated = await updateProfile(accessToken, { nickname: n, email: m })
      setProfile(updated)
      setNickname(updated.nickname ?? '')
      setEmail(updated.email ?? '')
      setSaved(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized()
        return
      }
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ email: EMAIL_TAKEN })
      } else if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors({ nickname: err.fieldErrors.nickname, email: err.fieldErrors.email })
      } else {
        setFormError(err instanceof Error ? err.message : '保存失败')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <section className="card profile-page">
        <h1>个人资料</h1>
        <p className="error" role="alert">
          {loadError}
        </p>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="card profile-page">
        <h1>个人资料</h1>
        <p className="hint">加载中…</p>
      </section>
    )
  }

  return (
    <section className="card profile profile-page" aria-live="polite">
      <h1>个人资料</h1>
      <dl>
        <dt>用户名</dt>
        <dd data-testid="profile-username">{profile.username}</dd>
        <dt>注册时间</dt>
        <dd data-testid="profile-createdAt">{formatTime(profile.createdAt)}</dd>
      </dl>

      <form className="profile-form" onSubmit={handleSubmit} noValidate data-testid="profile-form">
        <label htmlFor="nickname">昵称</label>
        <input
          id="nickname"
          name="nickname"
          value={nickname}
          disabled={saving}
          placeholder="1–20 个字符，可留空"
          aria-invalid={Boolean(fieldErrors.nickname)}
          onChange={(e) => setNickname(e.target.value)}
        />
        {fieldErrors.nickname ? (
          <p className="error field-error" data-testid="nickname-error">
            {fieldErrors.nickname}
          </p>
        ) : null}

        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={saving}
          placeholder="可留空"
          aria-invalid={Boolean(fieldErrors.email)}
          onChange={(e) => setEmail(e.target.value)}
        />
        {fieldErrors.email ? (
          <p className="error field-error" data-testid="email-error">
            {fieldErrors.email}
          </p>
        ) : null}

        {formError ? (
          <p className="error" role="alert">
            {formError}
          </p>
        ) : null}
        {saved ? (
          <p className="success" role="status" data-testid="profile-success">
            资料已更新
          </p>
        ) : null}

        <button type="submit" disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </button>
      </form>
    </section>
  )
}
