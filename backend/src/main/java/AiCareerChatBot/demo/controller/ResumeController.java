package AiCareerChatBot.demo.controller;

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

    @PostMapping("/upload")
    public ResponseEntity<String> uploadResume(@RequestParam("file") MultipartFile file) {
        Long userId = getCurrentUserId();
        String result = resumeService.handleResumeUpload(userId, file);
        return ResponseEntity.ok(result);
    }

    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof String) {
                return Long.parseLong((String) authentication.getPrincipal());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
