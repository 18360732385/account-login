package com.example.accountlogin.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 服务端 JWT 吊销名单（按 jti）。演示用内存实现，进程重启失效。
 */
@Component
public class TokenDenylist {

    private final Map<String, Instant> revokedUntil = new ConcurrentHashMap<>();

    public void revoke(String jti, Instant expiresAt) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        Instant until = expiresAt != null ? expiresAt : Instant.now().plusSeconds(3600);
        revokedUntil.merge(jti, until, (a, b) -> a.isAfter(b) ? a : b);
        purgeExpired();
    }

    public boolean isRevoked(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        Instant until = revokedUntil.get(jti);
        if (until == null) {
            return false;
        }
        if (until.isBefore(Instant.now())) {
            revokedUntil.remove(jti, until);
            return false;
        }
        return true;
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        revokedUntil.entrySet().removeIf(e -> e.getValue().isBefore(now));
    }
}
