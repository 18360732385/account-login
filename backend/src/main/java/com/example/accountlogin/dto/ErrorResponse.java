package com.example.accountlogin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * 统一错误体。fieldErrors 仅在字段级校验失败 / 字段冲突时出现（null 时 JSON 省略）。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String code, String message, Map<String, String> fieldErrors) {

    public ErrorResponse(String code, String message) {
        this(code, message, null);
    }
}
