package com.example.accountlogin.dto;

/**
 * 修改个人资料请求。字段缺省或 null = 不修改；空串 = 清空。
 * 无 username 字段：用户名不可修改（请求体中的 username 被忽略）。
 */
public record UpdateProfileRequest(String nickname, String email) {
}
