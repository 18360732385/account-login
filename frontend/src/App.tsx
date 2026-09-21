import { useCallback, useState } from 'react'
import { ApiError, changePassword, fetchMe, login, logout, register } from './api/client'
import type { LoginResponse, MeResponse } from './api/types'
import { LoginForm } from './components/LoginForm'
import { ProfileView } from './components/ProfileView'
import { RegisterForm } from './components/RegisterForm'
import './App.css'

type Session = {
  token: LoginResponse
  me: MeResponse
}

type AuthView = 'login' | 'register'

function errMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return fallback
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authView, setAuthView] = useState<AuthView>('login')
  const [loading, setLoading] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [changeBusy, setChangeBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [changeError, setChangeError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const enterSession = useCallback(async (token: LoginResponse) => {
    const me = await fetchMe(token.accessToken)
    setSession({ token, me })
    setAuthView('login')
  }, [])

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      setLoading(true)
      setError(null)
      setInfo(null)
      try {
        const token = await login({ username, password })
        await enterSession(token)
      } catch (err) {
        setError(errMessage(err, '登录失败'))
        setSession(null)
      } finally {
        setLoading(false)
      }
    },
    [enterSession],
  )

  const handleRegister = useCallback(
    async (username: string, password: string) => {
      setLoading(true)
      setError(null)
      setInfo(null)
      try {
        const token = await register({ username, password })
        await enterSession(token)
      } catch (err) {
        setError(errMessage(err, '注册失败'))
        setSession(null)
      } finally {
        setLoading(false)
      }
    },
    [enterSession],
  )

  const handleLogout = useCallback(async () => {
    if (!session) return
    setLogoutBusy(true)
    setError(null)
    try {
      await logout(session.token.accessToken)
    } catch {
      // 即使服务端吊销失败，前端仍清理会话（客户端幂等）
    } finally {
      setSession(null)
      setChangeError(null)
      setLogoutBusy(false)
      setInfo('已退出登录')
      setAuthView('login')
    }
  }, [session])

  const handleChangePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      if (!session) return
      setChangeBusy(true)
      setChangeError(null)
      try {
        await changePassword(session.token.accessToken, { oldPassword, newPassword })
        setSession(null)
        setInfo('密码已修改，请使用新密码重新登录')
        setAuthView('login')
      } catch (err) {
        setChangeError(errMessage(err, '改密失败'))
      } finally {
        setChangeBusy(false)
      }
    },
    [session],
  )

  return (
    <main className="app">
      {session ? (
        <ProfileView
          me={session.me}
          token={session.token}
          onLogout={() => {
            void handleLogout()
          }}
          onChangePassword={handleChangePassword}
          logoutBusy={logoutBusy}
          changeBusy={changeBusy}
          changeError={changeError}
        />
      ) : (
        <>
          {info ? (
            <p className="banner" role="status" data-testid="info-banner">
              {info}
            </p>
          ) : null}
          {authView === 'register' ? (
            <RegisterForm
              onSubmit={handleRegister}
              onSwitchToLogin={() => {
                setError(null)
                setAuthView('login')
              }}
              disabled={loading}
              error={error}
            />
          ) : (
            <LoginForm
              onSubmit={handleLogin}
              onSwitchToRegister={() => {
                setError(null)
                setInfo(null)
                setAuthView('register')
              }}
              disabled={loading}
              error={error}
            />
          )}
        </>
      )}
    </main>
  )
}
