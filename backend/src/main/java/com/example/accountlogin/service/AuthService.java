package com.example.accountlogin.service;

import com.example.accountlogin.dto.ChangePasswordRequest;
import com.example.accountlogin.dto.LoginRequest;
import com.example.accountlogin.dto.RegisterRequest;
import com.example.accountlogin.dto.LoginResponse;
import com.example.accountlogin.dto.MeResponse;
import com.example.accountlogin.dto.MessageResponse;
import com.example.accountlogin.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final DemoUserStore userStore;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenDenylist tokenDenylist;

    public AuthService(
            DemoUserStore userStore,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TokenDenylist tokenDenylist
    ) {
        this.userStore = userStore;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenDenylist = tokenDenylist;
    }


    public LoginResponse register(RegisterRequest request) {
        String username = request.username().trim();
        try {
            DemoUser user = userStore.register(username, request.password());
            String token = jwtService.generateToken(user.username(), user.tokenVersion());
            return LoginResponse.bearer(token, jwtService.getExpirationMs());
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已存在");
        }
    }

    public LoginResponse login(LoginRequest request) {
        DemoUser user = userStore.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误"));

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }

        String token = jwtService.generateToken(user.username(), user.tokenVersion());
        return LoginResponse.bearer(token, jwtService.getExpirationMs());
    }

    public MeResponse me(String username) {
        DemoUser user = userStore.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户不存在"));
        return new MeResponse(user.username(), user.displayName());
    }

    public MessageResponse logout(String rawToken) {
        revokeToken(rawToken);
        return new MessageResponse("已登出");
    }

    public MessageResponse changePassword(String username, String rawToken, ChangePasswordRequest request) {
        if (request.newPassword().equals(request.oldPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "新密码不能与旧密码相同");
        }
        DemoUser user = userStore.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户不存在"));

        if (!passwordEncoder.matches(request.oldPassword(), user.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "旧密码不正确");
        }

        userStore.updatePassword(username, request.newPassword());
        // 版本递增已使旧 JWT 失效；同时吊销当前 jti 便于测试断言 denylist
        revokeToken(rawToken);
        return new MessageResponse("密码已修改，请重新登录");
    }

    private void revokeToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        try {
            String jti = jwtService.extractJti(rawToken);
            tokenDenylist.revoke(jti, jwtService.extractExpiration(rawToken));
        } catch (Exception ignored) {
            // 无效 token：登出仍视为成功（幂等）
        }
    }
}
