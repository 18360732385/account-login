package com.example.accountlogin.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Locale;
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
        Instant seededAt = Instant.now();
        users.put("demo", new DemoUser("demo", passwordEncoder.encode("demo123"), "演示用户", 0, null, null, seededAt));
        users.put("admin", new DemoUser("admin", passwordEncoder.encode("admin123"), "管理员", 0, null, null, seededAt));
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
        DemoUser updated = current.withPassword(
                passwordEncoder.encode(newRawPassword),
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
        users.put(username, current.withPassword(passwordEncoder.encode(rawPassword), 0));
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
                0,
                null,
                null,
                Instant.now()
        );
        users.put(username, created);
        return created;
    }

    /**
     * 整体替换昵称与邮箱（入参即最终值，可为 null）。
     * 邮箱非空时不区分大小写检查是否被其他用户占用：占用抛 IllegalStateException（由服务层映射为 409）。
     * synchronized 保证「判重 + 写入」原子。
     */
    public synchronized DemoUser updateProfile(String username, String nickname, String email) {
        DemoUser current = users.get(username);
        if (current == null) {
            throw new IllegalArgumentException("用户不存在: " + username);
        }
        if (email != null) {
            String normalized = email.toLowerCase(Locale.ROOT);
            boolean taken = users.values().stream()
                    .anyMatch(u -> !u.username().equals(username)
                            && u.email() != null
                            && u.email().toLowerCase(Locale.ROOT).equals(normalized));
            if (taken) {
                throw new IllegalStateException("邮箱已被使用");
            }
        }
        DemoUser updated = current.withProfile(nickname, email);
        users.put(username, updated);
        return updated;
    }

    /** 测试辅助：把昵称与邮箱置空（资料类集成测试改共享账号后恢复，同 P2）。 */
    public synchronized void resetProfile(String username) {
        DemoUser current = users.get(username);
        if (current != null) {
            users.put(username, current.withProfile(null, null));
        }
    }

    /** 测试辅助：删除非预置用户，避免注册用例污染内存仓。 */
    public void removeIfPresent(String username) {
        if ("demo".equals(username) || "admin".equals(username)) {
            return;
        }
        users.remove(username);
    }
}
