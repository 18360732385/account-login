package com.example.accountlogin.service;

/**
 * @param tokenVersion 嵌入 JWT；改密时递增以使旧 token 全部失效
 */
public record DemoUser(String username, String passwordHash, String displayName, int tokenVersion) {
}
