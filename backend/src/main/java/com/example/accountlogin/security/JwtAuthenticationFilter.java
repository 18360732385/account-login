package com.example.accountlogin.security;

import com.example.accountlogin.service.DemoUser;
import com.example.accountlogin.service.DemoUserStore;
import com.example.accountlogin.service.TokenDenylist;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenDenylist tokenDenylist;
    private final DemoUserStore userStore;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            TokenDenylist tokenDenylist,
            DemoUserStore userStore
    ) {
        this.jwtService = jwtService;
        this.tokenDenylist = tokenDenylist;
        this.userStore = userStore;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.isValid(token)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {
                String jti = jwtService.extractJti(token);
                if (tokenDenylist.isRevoked(jti)) {
                    filterChain.doFilter(request, response);
                    return;
                }
                String username = jwtService.extractUsername(token);
                int tokenVersion = jwtService.extractTokenVersion(token);
                DemoUser user = userStore.findByUsername(username).orElse(null);
                if (user == null || user.tokenVersion() != tokenVersion) {
                    filterChain.doFilter(request, response);
                    return;
                }
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                token,
                                AuthorityUtils.createAuthorityList("ROLE_USER")
                        );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        filterChain.doFilter(request, response);
    }
}
