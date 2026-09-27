import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  changePassword,
  fetchMe,
  fetchProfile,
  getApiBaseUrl,
  login,
  logout,
  register,
  updateProfile,
} from './client'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('getApiBaseUrl', () => {
  it('returns empty string by default for proxy mode', () => {
    expect(getApiBaseUrl()).toBe('')
  })
})

describe('register', () => {
  it('success returns token payload', async () => {
    const payload = {
      accessToken: 'jwt-new',
      tokenType: 'Bearer',
      expiresInMs: 3600000,
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    )
    const res = await register({ username: 'newbie', password: 'pass123' })
    expect(res).toEqual(payload)
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('duplicate surfaces ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ message: '用户名已存在' }),
      }),
    )
    await expect(register({ username: 'demo', password: 'pass123' })).rejects.toMatchObject({
      status: 409,
      message: '用户名已存在',
    })
  })

  it('validation surfaces ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: '密码至少 6 位' }),
      }),
    )
    await expect(register({ username: 'x', password: '123' })).rejects.toMatchObject({
      status: 400,
      message: '密码至少 6 位',
    })
  })
})

describe('login', () => {
  it('success returns token payload', async () => {
    const payload = {
      accessToken: 'jwt-demo',
      tokenType: 'Bearer',
      expiresInMs: 3600000,
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    )

    const res = await login({ username: 'demo', password: 'demo123' })
    expect(res).toEqual(payload)
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('fail surfaces ApiError with message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ code: 'BAD_CREDENTIALS', message: '用户名或密码错误' }),
      }),
    )

    await expect(login({ username: 'demo', password: 'wrong' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: '用户名或密码错误',
    } satisfies Partial<ApiError>)
  })
})

describe('fetchMe', () => {
  it('authed me returns profile', async () => {
    const me = { username: 'demo', displayName: 'Demo User' }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => me,
      }),
    )

    const res = await fetchMe('jwt-demo')
    expect(res).toEqual(me)
    expect(fetch).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer jwt-demo' },
      }),
    )
  })

  it('unauthorized throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ code: 'UNAUTHORIZED', message: '需要登录' }),
      }),
    )

    await expect(fetchMe('bad')).rejects.toMatchObject({ status: 401, message: '需要登录' })
  })
})

describe('logout', () => {
  it('posts bearer and returns message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: '已登出' }),
      }),
    )
    await expect(logout('tok')).resolves.toEqual({ message: '已登出' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer tok' },
      }),
    )
  })
})

describe('changePassword', () => {
  it('posts body with bearer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: '密码已修改，请重新登录' }),
      }),
    )
    await expect(
      changePassword('tok', { oldPassword: 'a', newPassword: 'bbbbbb' }),
    ).resolves.toEqual({ message: '密码已修改，请重新登录' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/change-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ oldPassword: 'a', newPassword: 'bbbbbb' }),
      }),
    )
  })

  it('wrong old password surfaces ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: '旧密码不正确' }),
      }),
    )
    await expect(
      changePassword('tok', { oldPassword: 'x', newPassword: 'yyyyyy' }),
    ).rejects.toMatchObject({ status: 400, message: '旧密码不正确' })
  })
})

describe('fetchProfile', () => {
  it('GET /api/users/me with bearer returns profile', async () => {
    const profile = {
      username: 'demo',
      nickname: null,
      email: null,
      createdAt: '2026-09-27T12:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => profile }))

    await expect(fetchProfile('tok')).resolves.toEqual(profile)
    expect(fetch).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer tok' } }),
    )
  })

  it('unauthorized throws ApiError 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ code: 'UNAUTHORIZED', message: '需要登录' }),
      }),
    )
    await expect(fetchProfile('bad')).rejects.toMatchObject({ status: 401, message: '需要登录' })
  })
})

describe('updateProfile', () => {
  it('PUT JSON body with bearer returns updated profile', async () => {
    const updated = {
      username: 'demo',
      nickname: '小明',
      email: 'demo@example.com',
      createdAt: '2026-09-27T12:00:00Z',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => updated }))

    await expect(
      updateProfile('tok', { nickname: '小明', email: 'demo@example.com' }),
    ).resolves.toEqual(updated)
    expect(fetch).toHaveBeenCalledWith(
      '/api/users/me',
      expect.objectContaining({
        method: 'PUT',
        headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: '小明', email: 'demo@example.com' }),
      }),
    )
  })

  it('409 surfaces ApiError with fieldErrors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          code: '409 CONFLICT',
          message: '该邮箱已被使用',
          fieldErrors: { email: '该邮箱已被使用' },
        }),
      }),
    )
    await expect(updateProfile('tok', { email: 'taken@example.com' })).rejects.toMatchObject({
      status: 409,
      message: '该邮箱已被使用',
      fieldErrors: { email: '该邮箱已被使用' },
    })
  })
})
