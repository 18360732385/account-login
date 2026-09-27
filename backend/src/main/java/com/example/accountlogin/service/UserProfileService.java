package com.example.accountlogin.service;

import com.example.accountlogin.dto.UpdateProfileRequest;
import com.example.accountlogin.dto.UserProfileResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 个人资料编排：查询 / 修改昵称与邮箱。
 * 字段缺省或 null = 不修改；去首尾空格后为空串 = 清空；其余按规则校验，错误聚合为 FieldValidationException。
 */
@Service
public class UserProfileService {

    static final String NICKNAME_INVALID = "昵称长度须为 1–20 个字符";
    static final String EMAIL_INVALID = "邮箱格式不正确";
    public static final String EMAIL_TAKEN = "该邮箱已被使用";

    private static final int NICKNAME_MAX = 20;
    private static final int EMAIL_MAX = 100;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final DemoUserStore userStore;

    public UserProfileService(DemoUserStore userStore) {
        this.userStore = userStore;
    }

    public UserProfileResponse get(String username) {
        return toResponse(findUser(username));
    }

    public UserProfileResponse update(String username, UpdateProfileRequest request) {
        DemoUser current = findUser(username);
        Map<String, String> errors = new LinkedHashMap<>();

        String nickname = current.nickname();
        if (request.nickname() != null) {
            String trimmed = request.nickname().strip();
            int length = trimmed.codePointCount(0, trimmed.length());
            if (trimmed.isEmpty()) {
                nickname = null;
            } else if (length > NICKNAME_MAX) {
                errors.put("nickname", NICKNAME_INVALID);
            } else {
                nickname = trimmed;
            }
        }

        String email = current.email();
        if (request.email() != null) {
            String trimmed = request.email().strip();
            if (trimmed.isEmpty()) {
                email = null;
            } else if (trimmed.length() > EMAIL_MAX || !EMAIL_PATTERN.matcher(trimmed).matches()) {
                errors.put("email", EMAIL_INVALID);
            } else {
                email = trimmed;
            }
        }

        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }

        try {
            return toResponse(userStore.updateProfile(username, nickname, email));
        } catch (IllegalStateException ex) {
            throw new EmailTakenException();
        }
    }

    private DemoUser findUser(String username) {
        return userStore.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户不存在"));
    }

    private static UserProfileResponse toResponse(DemoUser user) {
        return new UserProfileResponse(user.username(), user.nickname(), user.email(), user.createdAt());
    }

    /** 邮箱被其他用户占用（409，带 fieldErrors.email）。 */
    public static class EmailTakenException extends ResponseStatusException {
        public EmailTakenException() {
            super(HttpStatus.CONFLICT, EMAIL_TAKEN);
        }
    }
}
