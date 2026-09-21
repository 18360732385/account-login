package com.example.accountlogin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "username 不能为空")
        @Size(min = 3, max = 32, message = "用户名长度须为 3–32")
        String username,

        @NotBlank(message = "password 不能为空")
        @Size(min = 6, message = "密码至少 6 位")
        String password
) {
}
