import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockFetchSequence(
  handlers: Array<(url: string, init?: RequestInit) => Promise<Partial<Response> & { json: () => Promise<unknown> }>>,
) {
  let i = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const handler = handlers[i++]
      if (!handler) throw new Error(`unexpected fetch: ${url}`)
      const partial = await handler(url, init)
      return {
        ok: partial.ok ?? true,
        status: partial.status ?? 200,
        json: partial.json,
      }
    }),
  )
}

async function loginAsDemo(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('用户名'), 'demo')
  await user.type(screen.getByLabelText('密码'), 'demo123')
  await user.click(screen.getByRole('button', { name: '登录' }))
  await waitFor(() => {
    expect(screen.getByTestId('me-username')).toHaveTextContent('demo')
  })
}

describe('App login flow', () => {
  it('login success shows /me profile and short token', async () => {
    const user = userEvent.setup()
    mockFetchSequence([
      async () => ({
        ok: true,
        json: async () => ({
          accessToken: 'aaaaaaaaaaaabbbbbbbbbbbbcccccccc',
          tokenType: 'Bearer',
          expiresInMs: 3600000,
        }),
      }),
      async () => ({
        ok: true,
        json: async () => ({ username: 'demo', displayName: 'Demo User' }),
      }),
    ])

    render(<App />)
    await loginAsDemo(user)
    expect(screen.getByTestId('me-displayName')).toHaveTextContent('Demo User')
    expect(screen.getByTestId('token-short')).toHaveTextContent('aaaaaaaaaaaa')
    expect(screen.getByTestId('token-short').textContent).toContain('…')
  })

  it('login fail shows error and stays on form', async () => {
    const user = userEvent.setup()
    mockFetchSequence([
      async () => ({
        ok: false,
        status: 401,
        json: async () => ({ message: '用户名或密码错误' }),
      }),
    ])

    render(<App />)
    await user.type(screen.getByLabelText('用户名'), 'demo')
    await user.type(screen.getByLabelText('密码'), 'wrong')
    await user.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('用户名或密码错误')
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
  })
})

describe('App logout + change-password', () => {
  it('logout calls API then returns to login form', async () => {
    const user = userEvent.setup()
    mockFetchSequence([
      async () => ({
        ok: true,
        json: async () => ({
          accessToken: 'tokentokentokentokentokenxx',
          tokenType: 'Bearer',
          expiresInMs: 3600000,
        }),
      }),
      async () => ({
        ok: true,
        json: async () => ({ username: 'demo', displayName: 'Demo User' }),
      }),
      async (url) => {
        expect(url).toContain('/api/auth/logout')
        return { ok: true, json: async () => ({ message: '已登出' }) }
      },
    ])

    render(<App />)
    await loginAsDemo(user)
    await user.click(screen.getByTestId('logout-button'))

    expect(await screen.findByRole('button', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByTestId('info-banner')).toHaveTextContent('已退出登录')
  })

  it('change-password success clears session and prompts re-login', async () => {
    const user = userEvent.setup()
    mockFetchSequence([
      async () => ({
        ok: true,
        json: async () => ({
          accessToken: 'tokentokentokentokentokenxx',
          tokenType: 'Bearer',
          expiresInMs: 3600000,
        }),
      }),
      async () => ({
        ok: true,
        json: async () => ({ username: 'demo', displayName: 'Demo User' }),
      }),
      async (url, init) => {
        expect(url).toContain('/api/auth/change-password')
        expect(init?.method).toBe('POST')
        return { ok: true, json: async () => ({ message: '密码已修改，请重新登录' }) }
      },
    ])

    render(<App />)
    await loginAsDemo(user)
    await user.type(screen.getByLabelText('旧密码'), 'demo123')
    await user.type(screen.getByLabelText('新密码'), 'demo456')
    await user.click(screen.getByRole('button', { name: '确认改密' }))

    expect(await screen.findByTestId('info-banner')).toHaveTextContent(
      '密码已修改，请使用新密码重新登录',
    )
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
  })

  it('change-password fail keeps profile and shows error', async () => {
    const user = userEvent.setup()
    mockFetchSequence([
      async () => ({
        ok: true,
        json: async () => ({
          accessToken: 'tokentokentokentokentokenxx',
          tokenType: 'Bearer',
          expiresInMs: 3600000,
        }),
      }),
      async () => ({
        ok: true,
        json: async () => ({ username: 'demo', displayName: 'Demo User' }),
      }),
      async () => ({
        ok: false,
        status: 400,
        json: async () => ({ message: '旧密码不正确' }),
      }),
    ])

    render(<App />)
    await loginAsDemo(user)
    await user.type(screen.getByLabelText('旧密码'), 'wrong')
    await user.type(screen.getByLabelText('新密码'), 'demo456')
    await user.click(screen.getByRole('button', { name: '确认改密' }))

    expect(await screen.findByTestId('change-password-error')).toHaveTextContent('旧密码不正确')
    expect(screen.getByTestId('me-username')).toHaveTextContent('demo')
  })
})

describe('App register flow', () => {
  it('register success lands in authenticated view', async () => {
    const user = userEvent.setup()
    mockFetchSequence([
      async (url) => {
        expect(url).toContain('/api/auth/register')
        return {
          ok: true,
          json: async () => ({
            accessToken: 'regtokentokentokentokenxx',
            tokenType: 'Bearer',
            expiresInMs: 3600000,
          }),
        }
      },
      async () => ({
        ok: true,
        json: async () => ({ username: 'newbie', displayName: 'newbie' }),
      }),
    ])

    render(<App />)
    await user.click(screen.getByTestId('goto-register'))
    await user.type(screen.getByLabelText('用户名'), 'newbie')
    await user.type(screen.getByLabelText('密码'), 'pass123')
    await user.click(screen.getByRole('button', { name: '注册' }))

    await waitFor(() => {
      expect(screen.getByTestId('me-username')).toHaveTextContent('newbie')
    })
  })

  it('register duplicate shows error and stays on form', async () => {
    const user = userEvent.setup()
    mockFetchSequence([
      async () => ({
        ok: false,
        status: 409,
        json: async () => ({ message: '用户名已存在' }),
      }),
    ])

    render(<App />)
    await user.click(screen.getByTestId('goto-register'))
    await user.type(screen.getByLabelText('用户名'), 'demo')
    await user.type(screen.getByLabelText('密码'), 'pass123')
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('用户名已存在')
    expect(screen.getByTestId('register-form')).toBeInTheDocument()
  })

  it('register client validation rejects short password', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('goto-register'))
    await user.type(screen.getByLabelText('用户名'), 'newbie')
    await user.type(screen.getByLabelText('密码'), '12345')
    await user.click(screen.getByRole('button', { name: '注册' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('密码至少 6 位')
  })
})
