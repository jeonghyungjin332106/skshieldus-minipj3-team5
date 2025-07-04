package AiCareerChatBot.demo.provider;

import AiCareerChatBot.demo.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Component
public class JwtProvider {

    private static final long ACCESS_TOKEN_VALIDITY = 1000L * 60 * 30;  // 30분
    private static final long REFRESH_TOKEN_VALIDITY = 1000L * 60 * 60 * 24 * 7;  // 7일

    @Value("${jwt.secret}")
    private String secret;
    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // AccessToken 생성 (User 객체를 받는 public 메서드) - 권한 정보 포함
    public String createAccessToken(User user) {
        String role = Boolean.TRUE.equals(user.getIsAdmin()) ? "ADMIN" : "USER";
        Map<String, Object> claims = Map.of(
                "userName", user.getUserName(),
                "role", role  // isAdmin 필드를 기반으로 권한 정보 추가
        );
        return createAccessToken(String.valueOf(user.getUserId()), claims);
    }

    // RefreshToken 생성 (User 객체를 받는 public 메서드)
    public String createRefreshToken(User user) {
        return createRefreshToken(String.valueOf(user.getUserId()));
    }

    // AccessToken 생성 (실제 구현 - private)
    private String createAccessToken(String subject, Map<String, Object> claims) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_VALIDITY))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    // RefreshToken 생성 (실제 구현 - private)
    private String createRefreshToken(String subject) {
        return Jwts.builder()
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_VALIDITY))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    // 토큰에서 사용자 ID 추출
    public String getUserIdFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    // 토큰에서 사용자 권한 추출
    public String getRoleFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("role", String.class));
    }

    // 토큰에서 사용자 이름 추출
    public String getUserNameFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("userName", String.class));
    }

    // 토큰에서 원하는 Claim 추출
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    // 모든 Claims 추출
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // 토큰 만료 여부 확인
    public boolean isTokenExpired(String token) {
        final Date expiration = getClaimFromToken(token, Claims::getExpiration);
        return expiration.before(new Date());
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException | ExpiredJwtException |
                 UnsupportedJwtException | IllegalArgumentException e) {
            log.warn("JWT 검증 실패: {}", e.getMessage());
            return false;
        }
    }

    // RefreshToken 만료 시간 반환 (Redis 저장시 사용)
    public long getRefreshTokenExpireTime() {
        return REFRESH_TOKEN_VALIDITY;
    }
}