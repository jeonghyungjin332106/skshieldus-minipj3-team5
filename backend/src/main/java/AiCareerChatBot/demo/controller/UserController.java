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

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin("http://localhost:3000")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserDto.SignUpRequest request) {
        // --- [수정] try-catch 블록을 제거하여 예외가 GlobalExceptionHandler로 전달되도록 합니다. ---

        // 1. 사용자 계정 생성
        UserDto.Response userResponse = userService.createUser(request);

        // 2. 생성된 계정으로 즉시 로그인하여 토큰 발급
        UserDto.LoginRequest loginRequest = new UserDto.LoginRequest();
        loginRequest.setLoginId(request.getLoginId());
        loginRequest.setPassword(request.getPassword());
        AuthService.LoginResponse loginResponse = authService.login(loginRequest);

        // 3. 프론트엔드가 기대하는 형태로 응답 데이터 구성
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("user", userResponse);
        responseBody.put("token", loginResponse.getAccessToken());
        responseBody.put("refreshToken", loginResponse.getRefreshToken());

        return new ResponseEntity<>(responseBody, HttpStatus.CREATED);
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
            String token = extractTokenFromRequest(request);
            if (token == null) {
                return ResponseEntity.badRequest().body("Token is required");
            }
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

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

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

    @Data
    public static class TokenRefreshRequest {
        private String refreshToken;
    }
}