package com.example.accountlogin.service;

import java.time.Instant;

/**
 * @param tokenVersion 嵌入 JWT；改密时递增以使旧 token 全部失效
 * @param nickname     用户自填昵称，可为 null（预置与新注册用户均为 null）
 * @param email        用户自填邮箱，可为 null；全局唯一（不区分大小写）
 * @param createdAt    注册时间；预置用户为进程启动时刻
 */
public record DemoUser(
        String username,
        String passwordHash,
        String displayName,
        int tokenVersion,
        String nickname,
        String email,
        Instant createdAt
) {

    DemoUser withPassword(String newPasswordHash, int newTokenVersion) {
        return new DemoUser(username, newPasswordHash, displayName, newTokenVersion, nickname, email, createdAt);
    }

    DemoUser withProfile(String newNickname, String newEmail) {
        return new DemoUser(username, passwordHash, displayName, tokenVersion, newNickname, newEmail, createdAt);
    }
}
