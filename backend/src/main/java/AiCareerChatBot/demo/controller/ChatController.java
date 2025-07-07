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
    public ResponseEntity<Void> saveChat(@RequestBody @Valid ChatMessageDto.Request dto) {
        Long userId = getCurrentUserId();
        chatService.saveChatMessage(userId, dto.getMessage(), dto.isSender());

        return ResponseEntity.ok().build();
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
