package com.example.accountlogin.controller;

import com.example.accountlogin.dto.ChangePasswordRequest;
import com.example.accountlogin.dto.LoginRequest;
import com.example.accountlogin.dto.RegisterRequest;
import com.example.accountlogin.dto.LoginResponse;
import com.example.accountlogin.dto.MeResponse;
import com.example.accountlogin.dto.MessageResponse;
import com.example.accountlogin.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/register")
    public LoginResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/auth/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        return authService.me(authentication.getName());
    }

    @PostMapping("/auth/logout")
    public MessageResponse logout(Authentication authentication) {
        String rawToken = credentialsAsToken(authentication);
        return authService.logout(rawToken);
    }

    @PostMapping("/auth/change-password")
    public MessageResponse changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        String rawToken = credentialsAsToken(authentication);
        return authService.changePassword(authentication.getName(), rawToken, request);
    }

    private static String credentialsAsToken(Authentication authentication) {
        Object credentials = authentication.getCredentials();
        return credentials != null ? credentials.toString() : null;
    }
}
