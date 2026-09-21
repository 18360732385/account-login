package com.example.accountlogin.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    public static final String CLAIM_JTI = "jti";
    public static final String CLAIM_TV = "tv";

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, int tokenVersion) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + properties.getExpirationMs());
        String jti = UUID.randomUUID().toString();
        return Jwts.builder()
                .id(jti)
                .subject(username)
                .claim(CLAIM_TV, tokenVersion)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractJti(String token) {
        Claims claims = parseClaims(token);
        String jti = claims.getId();
        if (jti == null) {
            Object raw = claims.get(CLAIM_JTI);
            jti = raw != null ? String.valueOf(raw) : null;
        }
        return jti;
    }

    public int extractTokenVersion(String token) {
        Object raw = parseClaims(token).get(CLAIM_TV);
        if (raw instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    public Instant extractExpiration(String token) {
        Date exp = parseClaims(token).getExpiration();
        return exp.toInstant();
    }

    public boolean isValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    public long getExpirationMs() {
        return properties.getExpirationMs();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
