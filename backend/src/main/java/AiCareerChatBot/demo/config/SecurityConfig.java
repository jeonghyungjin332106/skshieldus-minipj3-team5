package AiCareerChatBot.demo.config;

import AiCareerChatBot.demo.provider.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // CSRF 비활성화 (JWT 사용)
                .csrf(csrf -> csrf.disable())
                
                // CORS 설정 적용
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                // 세션 관리 정책 STATELESS 설정
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                
                // 인증/인가 설정
                .authorizeHttpRequests(requests -> requests
                        // 기본 페이지 및 정적 리소스 허용
                        .requestMatchers("/", "/index.html").permitAll()
                        .requestMatchers("/static/**", "/css/**", "/js/**", "/images/**", "/favicon.ico", "/areas/**", "/categories/**").permitAll()

                        // 상품 조회 API만 허용 (POST, PUT, DELETE는 인증 필요)
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()

                        // 개발 환경 리소스 허용
                        .requestMatchers("/src/**", "/Users/**", "/@vite/**", "/node_modules/**").permitAll()
                        
                        // H2 콘솔 접근 허용 (개발 환경)
                        .requestMatchers("/h2-console/**").permitAll()
                        
                        // 인증 관련 API 허용
                        .requestMatchers("/api/auth/signup", "/api/auth/login", "/api/auth/refresh").permitAll()

                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                )
                
                // 예외 처리
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(customAuthenticationEntryPoint()))
                
                // H2 콘솔을 위한 프레임 옵션 비활성화
                .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()))
                
                // 기본 인증 방식 비활성화
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                
                // JWT 인증 필터 추가
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000")); // 프론트엔드 주소
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationEntryPoint customAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"인증이 필요합니다.\"}");
        };
    }
}