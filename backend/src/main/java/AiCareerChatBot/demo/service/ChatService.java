package AiCareerChatBot.demo.service;

import AiCareerChatBot.demo.dto.ConversationSummaryDto;
import AiCareerChatBot.demo.entity.ChatMessage;

import java.util.List;

public interface ChatService {

    ChatMessage saveChatMessage(Long userId, String message, boolean isSender, String conversationId);

    String getAIResponse(Long userId, String userMessage);

    List<ConversationSummaryDto> getConversationSummaries(Long userId);

    List<ChatMessage> getMessagesByConversationId(Long userId, String conversationId);

    void deleteConversation(Long userId, String conversationId);

}