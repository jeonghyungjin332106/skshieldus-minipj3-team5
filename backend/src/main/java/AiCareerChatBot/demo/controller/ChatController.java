package AiCareerChatBot.demo.controller;

import AiCareerChatBot.demo.dto.ChatMessageDto;
import AiCareerChatBot.demo.entity.ChatMessage;
import AiCareerChatBot.demo.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/send")
    public ResponseEntity<ChatMessageDto.Response> saveChat(@RequestBody @Valid ChatMessageDto.Request dto) {
        Long userId = getCurrentUserId();

        // 1. 사용자 메시지 저장 (isSender=true)
        chatService.saveChatMessage(userId, dto.getMessage(), true);

        // 2. AI 응답 생성 요청
        String aiResponse = chatService.getAIResponse(dto.getMessage());

        // 3. AI 응답 저장 (isSender=false)
        chatService.saveChatMessage(userId, aiResponse, false);

        // 4. 프론트로 응답 반환
        return ResponseEntity.ok(new ChatMessageDto.Response(aiResponse, false));
    }

    @GetMapping("/history")
    public  ResponseEntity<List<ChatMessageDto.Response>> getHistory() {
        Long userId = getCurrentUserId();
        List<ChatMessage> messages = chatService.getChatHistory(userId);
        List<ChatMessageDto.Response> responseList = messages.stream()
                .map(ChatMessageDto.Response::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
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
}
