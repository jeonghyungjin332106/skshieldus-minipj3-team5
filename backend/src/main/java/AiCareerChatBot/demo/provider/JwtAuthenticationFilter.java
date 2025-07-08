package AiCareerChatBot.demo.provider;

import AiCareerChatBot.demo.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final AuthService authService;

    // --- [수정된 부분] ---
    // Nginx 프록시를 거쳐 백엔드가 실제로 받는 경로를 기준으로 /api 접두사를 제거합니다.
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/auth/login",
            "/auth/signup",
            "/auth/refresh",
            "/h2-console/"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (shouldSkipFilter(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getTokenFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtProvider.validateToken(jwt)) {

                if (authService.isTokenBlacklisted(jwt)) {
                    log.warn("Attempted access with blacklisted token.");
                    SecurityContextHolder.clearContext();
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"error\":\"Invalid Token\",\"message\":\"로그아웃 처리된 토큰입니다.\"}");
                    return;
                }

                String userId = jwtProvider.getUserIdFromToken(jwt);
                String role = jwtProvider.getRoleFromToken(jwt);
                String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                SimpleGrantedAuthority grantedAuthority = new SimpleGrantedAuthority(authority);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, Collections.singletonList(grantedAuthority));
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.error("Could not set user authentication in security context", e);
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * 필터를 건너뛸지 결정하는 메소드
     */
    private boolean shouldSkipFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return EXCLUDED_PATHS.stream().anyMatch(excludedPath ->
            excludedPath.endsWith("/") ? path.startsWith(excludedPath) : path.equals(excludedPath)
        );
    }
}