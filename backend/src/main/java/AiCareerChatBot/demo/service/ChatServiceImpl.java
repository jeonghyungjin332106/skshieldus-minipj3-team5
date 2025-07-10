package AiCareerChatBot.demo.service;

import AiCareerChatBot.demo.dto.LangServeResponseDto; // [수정]
import AiCareerChatBot.demo.dto.ConversationSummaryDto;
import AiCareerChatBot.demo.entity.ChatMessage;
import AiCareerChatBot.demo.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final WebClient webClient;

    @Override
    @Transactional
    public ChatMessage saveChatMessage(Long userId, String message, boolean isSender, String conversationId) {
        String convId = (conversationId != null && !conversationId.trim().isEmpty()) ? conversationId : UUID.randomUUID().toString();
        ChatMessage chatMessage = ChatMessage.builder()
                .userId(userId)
                .message(message)
                .sender(isSender)
                .conversationId(convId)
                .timestamp(LocalDateTime.now())
                .build();
        return chatMessageRepository.save(chatMessage);
    }

    @Override
    public String getAIResponse(Long userId, String userMessage) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("userId", String.valueOf(userId));
            requestBody.put("userMessage", userMessage);
            requestBody.put("temperature", 0.5);

            // [수정] 응답을 받을 DTO 클래스를 LangServeResponseDto로 변경
            LangServeResponseDto aiResponse = webClient.post()
                    .uri("/api/chat/ask")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(LangServeResponseDto.class)
                    .block();

            return aiResponse != null ? aiResponse.getAiResponse() : "AI로부터 응답을 받지 못했습니다.";
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI 서버와 통신 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationSummaryDto> getConversationSummaries(Long userId) {
        return chatMessageRepository.findConversationSummariesByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessage> getMessagesByConversationId(Long userId, String conversationId) {
        return chatMessageRepository.findByUserIdAndConversationIdOrderByTimestampAsc(userId, conversationId);
    }

    @Override
    @Transactional
    public void deleteConversation(Long userId, String conversationId) {
        List<ChatMessage> messagesToDelete = chatMessageRepository.findByUserIdAndConversationIdOrderByTimestampAsc(userId, conversationId);
        chatMessageRepository.deleteAll(messagesToDelete);
    }
}