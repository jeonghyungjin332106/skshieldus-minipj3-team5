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

    // 인증을 건너뛸 경로들
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/refresh",
            "/h2-console"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            // 1. 제외 경로 확인
            if (shouldSkipFilter(request)) {
                filterChain.doFilter(request, response);
                return;
            }

            // 2. 요청에서 JWT 토큰 추출
            String jwt = getTokenFromRequest(request);

            // 3. 토큰이 있고 유효한 경우 인증 처리
            if (StringUtils.hasText(jwt) && jwtProvider.validateToken(jwt)) {

                // 4. 토큰이 블랙리스트에 있는지 확인
                if (authService.isTokenBlacklisted(jwt)) {
                    log.warn("블랙리스트에 등록된 토큰으로 접근 시도: {}", jwt.substring(0, 20) + "...");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("로그아웃된 토큰입니다.");
                    return;
                }

                // 5. 토큰에서 사용자 정보 추출
                String userId = jwtProvider.getUserIdFromToken(jwt);
                String role = jwtProvider.getRoleFromToken(jwt);

                // 6. 권한 객체 생성 (ROLE_ 접두사 확인 후 추가)
                String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                SimpleGrantedAuthority grantedAuthority = new SimpleGrantedAuthority(authority);

                // 7. 인증 객체 생성
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId, // principal에 userId 저장
                                null, // credentials는 null (이미 검증됨)
                                Collections.singletonList(grantedAuthority) // JWT에서 추출한 권한 정보
                        );

                // 8. 요청 세부정보 설정
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 9. SecurityContext에 인증 정보 설정
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("사용자 인증 완료: userId={}, role={}", userId, authority);
            }

        } catch (Exception e) {
            log.error("JWT 인증 처리 중 오류 발생: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        // 10. 다음 필터로 요청 전달
        filterChain.doFilter(request, response);
    }

    /**
     * HTTP 요청에서 JWT 토큰 추출
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * 필터를 건너뛸지 결정
     */
    private boolean shouldSkipFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return EXCLUDED_PATHS.stream().anyMatch(path::startsWith);
    }
}