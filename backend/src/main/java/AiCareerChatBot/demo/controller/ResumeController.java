package AiCareerChatBot.demo.controller;

import AiCareerChatBot.demo.provider.JwtProvider;
import AiCareerChatBot.demo.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final JwtProvider jwtProvider;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadResume(@RequestParam("file") MultipartFile file,
                                               @RequestHeader("Authorization") String authorizationHeader) {
        Long userId = extractUserIdFromJwt(authorizationHeader);
        String result = resumeService.handleResumeUpload(userId, file);
        return ResponseEntity.ok(result);
    }
    private Long extractUserIdFromJwt(String authorizationHeader) {
        try {
            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                String token = authorizationHeader.substring(7); // "Bearer " 제거
                String userIdStr = jwtProvider.getUserIdFromToken(token);
                return Long.parseLong(userIdStr);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null; // anonymous fallback (AI 서버에서 기본값 있음)
    }
}