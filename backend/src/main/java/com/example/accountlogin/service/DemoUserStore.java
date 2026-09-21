package com.example.accountlogin.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 演示用户内存仓。预置：
 * <ul>
 *   <li>demo / demo123</li>
 *   <li>admin / admin123</li>
 * </ul>
 * 注意：改密会改写内存哈希；集成测试须自行恢复，避免污染共享账号。
 */
@Component
public class DemoUserStore {

    private final Map<String, DemoUser> users = new ConcurrentHashMap<>();
    private final PasswordEncoder passwordEncoder;

    public DemoUserStore(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
        users.put("demo", new DemoUser("demo", passwordEncoder.encode("demo123"), "演示用户", 0));
        users.put("admin", new DemoUser("admin", passwordEncoder.encode("admin123"), "管理员", 0));
    }

    public Optional<DemoUser> findByUsername(String username) {
        return Optional.ofNullable(users.get(username));
    }

    /**
     * 更新密码并递增 tokenVersion（使既有 JWT 失效）。
     */
    public DemoUser updatePassword(String username, String newRawPassword) {
        DemoUser current = users.get(username);
        if (current == null) {
            throw new IllegalArgumentException("用户不存在: " + username);
        }
        DemoUser updated = new DemoUser(
                current.username(),
                passwordEncoder.encode(newRawPassword),
                current.displayName(),
                current.tokenVersion() + 1
        );
        users.put(username, updated);
        return updated;
    }

    /** 测试辅助：把密码重置为已知明文并重置 tokenVersion。 */
    public void resetCredentials(String username, String rawPassword) {
        DemoUser current = users.get(username);
        if (current == null) {
            throw new IllegalArgumentException("用户不存在: " + username);
        }
        users.put(username, new DemoUser(
                current.username(),
                passwordEncoder.encode(rawPassword),
                current.displayName(),
                0
        ));
    }

    /**
     * 注册新用户。用户名冲突抛 IllegalStateException（由服务层映射为 409）。
     */
    public DemoUser register(String username, String rawPassword) {
        if (users.containsKey(username)) {
            throw new IllegalStateException("用户名已存在");
        }
        DemoUser created = new DemoUser(
                username,
                passwordEncoder.encode(rawPassword),
                username,
                0
        );
        users.put(username, created);
        return created;
    }

    /** 测试辅助：删除非预置用户，避免注册用例污染内存仓。 */
    public void removeIfPresent(String username) {
        if ("demo".equals(username) || "admin".equals(username)) {
            return;
        }
        users.remove(username);
    }
}
