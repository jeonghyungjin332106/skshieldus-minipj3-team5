package AiCareerChatBot.demo.controller;

import AiCareerChatBot.demo.dto.UserDto;
import AiCareerChatBot.demo.service.AuthService;
import AiCareerChatBot.demo.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("http://localhost:3000")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserDto.SignUpRequest request) {
        try {
            UserDto.Response user = userService.createUser(request);
            return new ResponseEntity<>(user, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace(); // 서버 콘솔에 에러 출력
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("서버 에러: " + e.getMessage());
        }
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<AuthService.LoginResponse> loginUser(@RequestBody UserDto.LoginRequest request) {
        AuthService.LoginResponse loginResponse = authService.login(request);
        return ResponseEntity.ok(loginResponse);
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        try {
            // Authorization 헤더에서 토큰 추출
            String token = extractTokenFromRequest(request);
            if (token == null) {
                return ResponseEntity.badRequest().body("Token is required");
            }

            // 현재 사용자 ID 추출 (JWT에서)
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.badRequest().body("Invalid user");
            }
            authService.logout(token, userId);
            return ResponseEntity.ok("Logged out successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error logging out");
        }
    }

    // 현재 사용자 계정 삭제
    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteCurrentUser(Authentication authentication) {
        Long userId = Long.parseLong(authentication.getName());
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // 토큰 갱신
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRefreshRequest request) {
        try {
            AuthService.TokenRefreshResponse response = authService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Token refresh failed: " + e.getMessage());
        }
    }

    // Authorization 헤더에서 토큰 추출
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    // 현재 사용자 ID 추출 (SecurityContext에서)
    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof String) {
                return Long.parseLong((String) authentication.getPrincipal());
            }
        } catch (Exception e) {
            // 로그 추가 가능
        }
        return null;
    }

    // 토큰 갱신 요청 DTO
    @Data
    public static class TokenRefreshRequest {
        private String refreshToken;
    }
}