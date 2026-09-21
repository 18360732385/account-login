package com.example.accountlogin.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresInMs
) {
    public static LoginResponse bearer(String token, long expiresInMs) {
        return new LoginResponse(token, "Bearer", expiresInMs);
    }
}
