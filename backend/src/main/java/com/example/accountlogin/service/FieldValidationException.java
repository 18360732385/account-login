package com.example.accountlogin.service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 字段级校验失败（400）。fieldErrors 保持插入顺序，首个错误作为 message。
 */
public class FieldValidationException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public FieldValidationException(Map<String, String> fieldErrors) {
        super(fieldErrors.values().stream().findFirst().orElse("参数校验失败"));
        this.fieldErrors = Collections.unmodifiableMap(new LinkedHashMap<>(fieldErrors));
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
