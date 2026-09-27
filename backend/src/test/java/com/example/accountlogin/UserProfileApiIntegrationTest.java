package com.example.accountlogin;

import com.example.accountlogin.service.DemoUserStore;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 个人资料接口集成测试（GET/PUT /api/users/me）。
 * 会改写共享预置账号 demo/admin 的资料，@AfterEach 必须 resetProfile 恢复（同 P2）。
 */
@SpringBootTest
@AutoConfigureMockMvc
class UserProfileApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DemoUserStore userStore;

    @AfterEach
    void restoreSeedProfiles() {
        userStore.resetProfile("demo");
        userStore.resetProfile("admin");
    }

    @Test
    void getProfileReturnsEmptyFieldsForSeedUser() throws Exception {
        String token = loginToken("demo", "demo123");

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo"))
                .andExpect(jsonPath("$.nickname").isEmpty())
                .andExpect(jsonPath("$.email").isEmpty())
                .andExpect(jsonPath("$.createdAt").isString())
                .andExpect(jsonPath("$.createdAt").value(org.hamcrest.Matchers.matchesPattern("^\\d{4}-\\d{2}-\\d{2}T.*Z$")))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.tokenVersion").doesNotExist());
    }

    @Test
    void updateProfileTrimsAndPersists() throws Exception {
        String token = loginToken("demo", "demo123");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nickname":"  小明  ","email":" demo@example.com "}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo"))
                .andExpect(jsonPath("$.nickname").value("小明"))
                .andExpect(jsonPath("$.email").value("demo@example.com"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("小明"))
                .andExpect(jsonPath("$.email").value("demo@example.com"));
    }

    @Test
    void updateRejectsTooLongNickname() throws Exception {
        String token = loginToken("demo", "demo123");
        String tooLong = "一二三四五六七八九十一二三四五六七八九十多";

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"" + tooLong + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("昵称长度须为 1–20 个字符"))
                .andExpect(jsonPath("$.fieldErrors.nickname").value("昵称长度须为 1–20 个字符"));

        // 20 个字符（去首尾空格后）恰好合法
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\" " + tooLong.substring(0, 20) + " \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value(tooLong.substring(0, 20)));
    }

    @Test
    void updateRejectsInvalidEmail() throws Exception {
        String token = loginToken("demo", "demo123");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nickname":"一二三四五六七八九十一二三四五六七八九十多","email":"not-an-email"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.fieldErrors.nickname").value("昵称长度须为 1–20 个字符"))
                .andExpect(jsonPath("$.fieldErrors.email").value("邮箱格式不正确"));

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"a@b"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("邮箱格式不正确"))
                .andExpect(jsonPath("$.fieldErrors.email").value("邮箱格式不正确"))
                .andExpect(jsonPath("$.fieldErrors.nickname").doesNotExist());
    }

    @Test
    void updateRejectsEmailTakenByOtherUser() throws Exception {
        String adminToken = loginToken("admin", "admin123");
        String demoToken = loginToken("demo", "demo123");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"taken@example.com"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + demoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"TAKEN@example.com"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("409 CONFLICT"))
                .andExpect(jsonPath("$.message").value("该邮箱已被使用"))
                .andExpect(jsonPath("$.fieldErrors.email").value("该邮箱已被使用"));

        // demo 资料未被改动
        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + demoToken))
                .andExpect(jsonPath("$.email").isEmpty());

        // 本人重复提交自己的邮箱不算冲突
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"Taken@Example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("Taken@Example.com"));
    }

    @Test
    void profileEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("需要登录"));

        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nickname":"x"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer invalid.token.value"))
                .andExpect(status().isUnauthorized());

        // 已登出（jti 吊销）的 token 同样 401
        String token = loginToken("demo", "demo123");
        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usernameInBodyIsIgnoredAndBlankClears() throws Exception {
        String token = loginToken("demo", "demo123");

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"hacker","nickname":"n1","email":"n1@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("demo"))
                .andExpect(jsonPath("$.nickname").value("n1"));

        // 空串清空昵称；缺省 email 不修改
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nickname":"   "}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").isEmpty())
                .andExpect(jsonPath("$.email").value("n1@example.com"));

        // 空对象不修改任何字段
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("n1@example.com"));

        assertThat(userStore.findByUsername("hacker")).isEmpty();
    }

    private String loginToken(String username, String password) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"%s"}
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(login.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }
}
