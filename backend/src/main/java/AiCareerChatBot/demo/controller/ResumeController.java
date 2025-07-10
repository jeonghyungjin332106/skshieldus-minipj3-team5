package AiCareerChatBot.demo.controller;

import AiCareerChatBot.demo.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    /**
     * [핵심 수정] 파일과 함께 전송되는 폼 데이터는 @RequestPart로 받습니다.
     * @param file 업로드된 이력서 파일 (MultipartFile)
     * @param userId 사용자 ID (Form 데이터)
     * @param chunkSize 프론트엔드에서 보낸 청크 사이즈 (Form 데이터)
     * @param chunkOverlap 프론트엔드에서 보낸 청크 중첩 값 (Form 데이터)
     * @param temperature 프론트엔드에서 보낸 AI 창의성 수준 (Form 데이터)
     * @return 처리 결과 (JSON 객체)
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadResume( // [수정] 반환 타입을 ResponseEntity<Map<String, String>>으로 명확히 지정
            @RequestPart("file") MultipartFile file,
            @RequestPart("userId") String userId, // 프론트엔드에서 userId를 Form으로 보냄
            @RequestPart("chunkSize") int chunkSize,
            @RequestPart("chunkOverlap") int chunkOverlap,
            @RequestPart("temperature") double temperature // [추가] temperature 파라미터
    ) {
        // userId는 프론트엔드에서 Form 데이터로 보내고 있으므로, getCurrentUserId() 대신 직접 사용합니다.
        // 하지만 인증된 사용자의 userId를 사용하는 것이 더 안전하므로, getCurrentUserId()를 통해 가져온 userId를 우선 사용합니다.
        Long authenticatedUserId = getCurrentUserId();
        String effectiveUserId = (authenticatedUserId != null) ? String.valueOf(authenticatedUserId) : userId;

        if (effectiveUserId == null || effectiveUserId.equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
        }

        try {
            // resumeService.handleResumeUpload 메서드 호출 시 모든 파라미터 전달
            String filePath = resumeService.handleResumeUpload(effectiveUserId, file, chunkSize, chunkOverlap, temperature);
            return ResponseEntity.ok(Map.of("message", "이력서가 성공적으로 업로드 및 처리되었습니다.", "file_path", filePath));
        } catch (Exception e) {
            e.printStackTrace(); // 개발 중 상세한 오류 확인을 위해 로그 출력
            String errorMessage = "파일 처리 중 서버 오류가 발생했습니다: " + e.getMessage();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", errorMessage));
        }
    }

    // getCurrentUserId 메서드는 그대로 유지
    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof String principal && !principal.equals("anonymousUser")) {
                return Long.parseLong(principal);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
