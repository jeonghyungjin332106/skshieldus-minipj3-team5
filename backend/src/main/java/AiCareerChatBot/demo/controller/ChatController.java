
package AiCareerChatBot.demo.controller;

import AiCareerChatBot.demo.dto.ChatMessageDto;
import AiCareerChatBot.demo.dto.ConversationSummaryDto;
import AiCareerChatBot.demo.entity.ChatMessage;
import AiCareerChatBot.demo.service.ChatService;
import AiCareerChatBot.demo.service.ChatServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatServiceImpl chatService;

    @PostMapping("/send")
    public ResponseEntity<ChatMessageDto.Response> saveChat(@RequestBody @Valid ChatMessageDto.Request dto) {
        Long userId = getCurrentUserId();

        // 1. 사용자 메시지 저장
        ChatMessage userMessage = chatService.saveChatMessage(userId, dto.getMessage(), true, dto.getConversationId());
        String conversationId = userMessage.getConversationId(); // 새 대화일 경우 생성된 ID를 가져옴

        // 2. AI 응답 생성
        String aiResponseText = chatService.getAIResponse(userId, dto.getMessage(), dto.getTemperature());

        // 3. AI 응답 저장
        chatService.saveChatMessage(userId, aiResponseText, false, conversationId);

        // 4. 프론트로 응답 반환 (수정된 생성자 사용)
        return ResponseEntity.ok(new ChatMessageDto.Response(aiResponseText, false, conversationId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ConversationSummaryDto>> getHistory() {
        Long userId = getCurrentUserId();
        List<ConversationSummaryDto> historySummaries = chatService.getConversationSummaries(userId);
        return ResponseEntity.ok(historySummaries);
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<List<ChatMessageDto.Response>> getConversationDetails(@PathVariable String conversationId) {
        Long userId = getCurrentUserId();
        List<ChatMessage> messages = chatService.getMessagesByConversationId(userId, conversationId);
        List<ChatMessageDto.Response> responseList = messages.stream()
                .map(ChatMessageDto.Response::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responseList);
    }

    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(@PathVariable String conversationId) {
        Long userId = getCurrentUserId();
        chatService.deleteConversation(userId, conversationId);
        return ResponseEntity.noContent().build();
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
        return null; // 또는 예외 발생
    }
}
