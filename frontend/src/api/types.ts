export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresInMs: number
}

export interface MeResponse {
  username: string
  displayName: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}

export interface UserProfileResponse {
  username: string
  nickname: string | null
  email: string | null
  /** ISO-8601 UTC 时刻 */
  createdAt: string
}

/** 字段缺省或 null = 不修改；空串 = 清空 */
export interface UpdateProfileRequest {
  nickname?: string | null
  email?: string | null
}

export interface ErrorResponse {
  code?: string
  message?: string
  /** 字段级错误（仅校验失败 / 字段冲突时出现） */
  fieldErrors?: Record<string, string>
}
