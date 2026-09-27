package com.example.accountlogin.controller;

import com.example.accountlogin.dto.UpdateProfileRequest;
import com.example.accountlogin.dto.UserProfileResponse;
import com.example.accountlogin.service.UserProfileService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 当前用户个人资料（需 JWT）。 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;

    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me")
    public UserProfileResponse getMe(Authentication authentication) {
        return userProfileService.get(authentication.getName());
    }

    @PutMapping("/me")
    public UserProfileResponse updateMe(Authentication authentication, @RequestBody UpdateProfileRequest request) {
        return userProfileService.update(authentication.getName(), request);
    }
}
