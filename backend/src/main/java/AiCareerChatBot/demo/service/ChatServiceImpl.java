package AiCareerChatBot.demo.service;

import AiCareerChatBot.demo.dto.ConversationSummaryDto;
import AiCareerChatBot.demo.entity.ChatMessage;
import AiCareerChatBot.demo.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final LangServeService langServeService; // AI 서버 연동 시 주석 해제

    @Override
    @Transactional
    public ChatMessage saveChatMessage(Long userId, String message, boolean isSender, String conversationId) {
        String convId = (conversationId != null && !conversationId.trim().isEmpty()) ? conversationId : UUID.randomUUID().toString();

        ChatMessage chatMessage = ChatMessage.builder()
                .userId(userId)
                .message(message)
                .sender(isSender) // [수정] isSender(isSender) -> sender(isSender)
                .conversationId(convId)
                .timestamp(LocalDateTime.now())
                .build();
        return chatMessageRepository.save(chatMessage);
    }

    @Override
    public String getAIResponse(Long userId, String userMessage) {
        return langServeService.getAIResponse(userId, userMessage);
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