package AiCareerChatBot.demo.service;

import AiCareerChatBot.demo.config.PasswordEncoderConfig;
import AiCareerChatBot.demo.dto.UserDto;
import AiCareerChatBot.demo.entity.User;
import AiCareerChatBot.demo.exception.*;
import AiCareerChatBot.demo.provider.JwtProvider;
import AiCareerChatBot.demo.repository.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoderConfig passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String REFRESH_TOKEN_PREFIX = "RT:";
    private static final String BLACKLIST_PREFIX = "BL:";

    // 로그인 처리
    public LoginResponse login(UserDto.LoginRequest request) {
        try {
            // 1. 사용자 조회
            User user = userRepository.findByLoginId(request.getLoginId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, request.getLoginId()));


            // 2. 비밀번호 검증
            if (!passwordEncoder.passwordEncoder().matches(request.getPassword(), user.getPassword())) {
                throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
            }

            // 3. JWT 토큰 생성
            String accessToken = jwtProvider.createAccessToken(user);
            String refreshToken = jwtProvider.createRefreshToken(user);

            // 4. Redis에 RefreshToken 저장 (기존 토큰이 있다면 덮어쓰기)
            String refreshTokenKey = REFRESH_TOKEN_PREFIX + user.getUserId();
            redisTemplate.opsForValue().set(
                    refreshTokenKey,
                    refreshToken,
                    jwtProvider.getRefreshTokenExpireTime(),
                    TimeUnit.MILLISECONDS
            );

            log.info("사용자 로그인 성공: {}", user.getLoginId());

            // 5. 응답 반환
            return LoginResponse.builder()
                    .userId(user.getUserId())
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .userName(user.getUserName())
                    .build();

        } catch (BusinessException e) { // Catch BusinessException first
            log.error("로그인 처리 중 비즈니스 오류 발생: {}", e.getMessage());
            throw e;
        } catch (AuthenticationException | InvalidCredentialsException e) { // Keep specific auth exceptions if needed by framework/advice
            log.error("로그인 처리 중 인증 오류 발생: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("로그인 처리 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.AUTH_UNEXPECTED_ERROR, "로그인", e.getMessage());
        }
    }

    // 로그아웃 처리
    public void logout(String accessToken, Long userId) {
        try {
            if (jwtProvider.validateToken(accessToken) && !jwtProvider.isTokenExpired(accessToken)) {
                Date expiration = jwtProvider.getClaimFromToken(accessToken, Claims::getExpiration);
                long ttl = expiration.getTime() - System.currentTimeMillis();

                if (ttl > 0) {
                    redisTemplate.opsForValue().set(
                            BLACKLIST_PREFIX + accessToken,
                            "logout",
                            ttl,
                            TimeUnit.MILLISECONDS
                    );
                }
            }

            String refreshTokenKey = REFRESH_TOKEN_PREFIX + userId;
            redisTemplate.delete(refreshTokenKey);

            log.info("사용자 로그아웃 완료: userId={}", userId);

        } catch (Exception e) {
            log.error("로그아웃 처리 중 오류 발생: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_UNEXPECTED_ERROR, "로그아웃", e.getMessage());
        }
    }

    // 토큰 갱신
    public TokenRefreshResponse refreshToken(String refreshToken) {
        try {
            // 1. RefreshToken 유효성 검증
            if (!jwtProvider.validateToken(refreshToken) || jwtProvider.isTokenExpired(refreshToken)) {
                throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN_DETAIL);
            }

            // 2. RefreshToken에서 사용자 ID 추출
            String userId = jwtProvider.getUserIdFromToken(refreshToken);

            // 3. Redis에서 저장된 RefreshToken과 비교
            String storedRefreshToken = redisTemplate.opsForValue().get(REFRESH_TOKEN_PREFIX + userId);
            if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
                throw new BusinessException(ErrorCode.INVALID_TOKEN, "저장된 RefreshToken과 일치하지 않습니다."); // Or a more specific error code
            }

            // 4. 사용자 정보 조회
            User user = userRepository.findById(Long.parseLong(userId))
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

            // 5. 새로운 AccessToken 생성
            String newAccessToken = jwtProvider.createAccessToken(user);

            log.info("토큰 갱신 완료: userId={}", userId);

            return TokenRefreshResponse.builder()
                    .accessToken(newAccessToken)
                    .build();

//        } catch (TokenValidationException | AuthenticationException e) {
//            log.error("토큰 갱신 중 오류 발생: {}", e.getMessage());
//            throw e; // 커스텀 예외는 그대로 던짐
        } catch (BusinessException e) { // BusinessException은 그대로 던지도록 수정
            log.error("토큰 갱신 중 비즈니스 오류 발생: {}", e.getMessage());
            throw e;
        } catch (TokenValidationException | AuthenticationException e) { // 특정 예외는 여전히 처리
            log.error("토큰 갱신 중 인증/토큰 유효성 오류 발생: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("토큰 갱신 중 예상치 못한 오류 발생: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_UNEXPECTED_ERROR, "토큰 갱신", e.getMessage());
        }
    }

    // AccessToken이 블랙리스트에 있는지 확인
    public boolean isTokenBlacklisted(String accessToken) {
        try {
            return redisTemplate.hasKey(BLACKLIST_PREFIX + accessToken);
        } catch (Exception e) {
            log.error("토큰 블랙리스트 확인 중 오류 발생: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_UNEXPECTED_ERROR, "토큰 블랙리스트 확인", e.getMessage());
        }
    }

    // 사용자의 모든 세션 무효화 (강제 로그아웃)
    public void invalidateAllSessions(Long userId) {
        try {
            String refreshTokenKey = REFRESH_TOKEN_PREFIX + userId;
            redisTemplate.delete(refreshTokenKey);
            log.info("사용자의 모든 세션 무효화 완료: userId={}", userId);
        } catch (Exception e) {
            log.error("세션 무효화 중 오류 발생: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_UNEXPECTED_ERROR, "세션 무효화", e.getMessage());
        }
    }

    @Data
    @Builder
    public static class LoginResponse {
        private Long userId;
        private String accessToken;
        private String refreshToken;
        private String userName;
    }

    @Data
    @Builder
    public static class TokenRefreshResponse {
        private String accessToken;
    }
}