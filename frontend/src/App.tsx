import { useCallback, useEffect, useState } from 'react'
import { ApiError, changePassword, fetchMe, login, logout, register } from './api/client'
import type { LoginResponse, MeResponse } from './api/types'
import { LoginForm } from './components/LoginForm'
import { NavBar } from './components/NavBar'
import { ProfilePage } from './components/ProfilePage'
import { ProfileView } from './components/ProfileView'
import { RegisterForm } from './components/RegisterForm'
import './App.css'

type Session = {
  token: LoginResponse
  me: MeResponse
}

type AuthView = 'login' | 'register'

/** 受保护路由（未登录访问 → /login，登录后回跳） */
const PROTECTED_PATHS = new Set(['/profile'])

function currentPath(): string {
  return window.location.pathname
}

/** 首次渲染：会话仅在内存，必为未登录；直接打开受保护路由 → /login 并记住回跳目标 */
function initialRoute(): { path: string; redirect: string | null } {
  const p = currentPath()
  return PROTECTED_PATHS.has(p) ? { path: '/login', redirect: p } : { path: p, redirect: null }
}

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
  const [initial] = useState(initialRoute)
  const [path, setPath] = useState<string>(initial.path)
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(initial.redirect)

  // 最小 History API 路由（本仓不引路由库，见 frontend/AGENTS.md）
  const navigate = useCallback((to: string, replace = false) => {
    if (replace) window.history.replaceState(null, '', to)
    else window.history.pushState(null, '', to)
    setPath(to)
  }, [])

  // 地址栏与路由状态对齐（首次重定向 /login 时用 replaceState）
  useEffect(() => {
    if (window.location.pathname !== path) window.history.replaceState(null, '', path)
  }, [path])

  // 浏览器前进/后退：未登录回到受保护路由 → 重定向登录页
  useEffect(() => {
    const onPop = () => {
      const p = currentPath()
      if (!session && PROTECTED_PATHS.has(p)) {
        setRedirectAfterLogin(p)
        navigate('/login', true)
      } else {
        setPath(p)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [session, navigate])

  const enterSession = useCallback(
    async (token: LoginResponse) => {
      const me = await fetchMe(token.accessToken)
      setSession({ token, me })
      setAuthView('login')
      if (redirectAfterLogin) {
        navigate(redirectAfterLogin, true)
        setRedirectAfterLogin(null)
      } else if (currentPath() === '/login') {
        navigate('/', true)
      }
    },
    [redirectAfterLogin, navigate],
  )

  const handleUnauthorized = useCallback(() => {
    setSession(null)
    setInfo('登录已失效，请重新登录')
    setAuthView('login')
    setRedirectAfterLogin(currentPath())
    navigate('/login', true)
  }, [navigate])

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
      navigate('/', true)
    }
  }, [session, navigate])

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
        navigate('/', true)
      } catch (err) {
        setChangeError(errMessage(err, '改密失败'))
      } finally {
        setChangeBusy(false)
      }
    },
    [session, navigate],
  )

  return (
    <main className="app">
      {session ? (
        <div className="shell">
          <NavBar path={path} onNavigate={(to) => navigate(to)} />
          {path === '/profile' ? (
            <ProfilePage
              accessToken={session.token.accessToken}
              onUnauthorized={handleUnauthorized}
            />
          ) : (
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
          )}
        </div>
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
