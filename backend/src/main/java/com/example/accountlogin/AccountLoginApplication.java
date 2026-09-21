package com.example.accountlogin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class AccountLoginApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccountLoginApplication.class, args);
    }
}
