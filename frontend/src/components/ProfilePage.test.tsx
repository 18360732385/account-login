import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const baseProfile = {
  username: 'demo',
  nickname: null,
  email: null,
  createdAt: '2026-09-27T12:00:00Z',
}

type FakeRes = { ok: boolean; status?: number; json: () => Promise<unknown> }

function stubFetch(...responses: Array<FakeRes | (() => Promise<FakeRes>)>) {
  const fn = vi.fn(async () => {
    const next = responses.shift()
    if (!next) throw new Error('unexpected fetch')
    const res = typeof next === 'function' ? await next() : next
    return { status: res.ok ? 200 : 500, ...res }
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('ProfilePage', () => {
  it('loads and shows read-only username/createdAt and editable fields', async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ ...baseProfile, nickname: '小明', email: 'demo@example.com' }),
    })
    render(<ProfilePage accessToken="tok" onUnauthorized={vi.fn()} />)

    expect(screen.getByText('加载中…')).toBeInTheDocument()
    expect(await screen.findByTestId('profile-username')).toHaveTextContent('demo')
    expect(screen.getByTestId('profile-createdAt').textContent).toMatch(/2026/)
    expect(screen.getByLabelText('昵称')).toHaveValue('小明')
    expect(screen.getByLabelText('邮箱')).toHaveValue('demo@example.com')
    expect(screen.queryByLabelText('用户名')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer tok' } }),
    )
  })

  it('client validation shows field hints and does not submit', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch({ ok: true, json: async () => baseProfile })
    render(<ProfilePage accessToken="tok" onUnauthorized={vi.fn()} />)
    await screen.findByTestId('profile-username')

    await user.type(screen.getByLabelText('昵称'), '一二三四五六七八九十一二三四五六七八九十多')
    await user.type(screen.getByLabelText('邮箱'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByTestId('nickname-error')).toHaveTextContent('昵称长度须为 1–20 个字符')
    expect(screen.getByTestId('email-error')).toHaveTextContent('邮箱格式不正确')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('submit disables button while saving and shows success', async () => {
    const user = userEvent.setup()
    let resolvePut: (v: FakeRes) => void = () => {}
    const fetchMock = stubFetch(
      { ok: true, json: async () => baseProfile },
      () => new Promise<FakeRes>((resolve) => (resolvePut = resolve)),
    )
    render(<ProfilePage accessToken="tok" onUnauthorized={vi.fn()} />)
    await screen.findByTestId('profile-username')

    await user.type(screen.getByLabelText('昵称'), '  小明  ')
    await user.type(screen.getByLabelText('邮箱'), 'demo@example.com')
    await user.click(screen.getByRole('button', { name: '保存' }))

    const saving = await screen.findByRole('button', { name: '保存中…' })
    expect(saving).toBeDisabled()
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/users/me',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ nickname: '小明', email: 'demo@example.com' }),
      }),
    )

    resolvePut({
      ok: true,
      json: async () => ({ ...baseProfile, nickname: '小明', email: 'demo@example.com' }),
    })
    expect(await screen.findByTestId('profile-success')).toHaveTextContent('资料已更新')
    expect(screen.getByRole('button', { name: '保存' })).toBeEnabled()
    expect(screen.getByLabelText('昵称')).toHaveValue('小明')
  })

  it('409 shows 该邮箱已被使用 under email field', async () => {
    const user = userEvent.setup()
    stubFetch(
      { ok: true, json: async () => baseProfile },
      {
        ok: false,
        status: 409,
        json: async () => ({
          code: '409 CONFLICT',
          message: '该邮箱已被使用',
          fieldErrors: { email: '该邮箱已被使用' },
        }),
      },
    )
    render(<ProfilePage accessToken="tok" onUnauthorized={vi.fn()} />)
    await screen.findByTestId('profile-username')

    await user.type(screen.getByLabelText('邮箱'), 'taken@example.com')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByTestId('email-error')).toHaveTextContent('该邮箱已被使用')
    expect(screen.queryByTestId('profile-success')).not.toBeInTheDocument()
  })

  it('401 on load calls onUnauthorized', async () => {
    const onUnauthorized = vi.fn()
    stubFetch({
      ok: false,
      status: 401,
      json: async () => ({ code: 'UNAUTHORIZED', message: '需要登录' }),
    })
    render(<ProfilePage accessToken="expired" onUnauthorized={onUnauthorized} />)

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1))
  })
})
