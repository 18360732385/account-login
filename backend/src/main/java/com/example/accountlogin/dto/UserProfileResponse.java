package com.example.accountlogin.dto;

import java.time.Instant;

/** 个人资料（不含密码哈希 / tokenVersion 等敏感或内部字段）。 */
public record UserProfileResponse(String username, String nickname, String email, Instant createdAt) {
}
