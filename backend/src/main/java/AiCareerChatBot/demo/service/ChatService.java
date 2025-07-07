package AiCareerChatBot.demo.service;

import AiCareerChatBot.demo.entity.ChatMessage;
import AiCareerChatBot.demo.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;

    public void saveChatMessage(Long userId, String message, boolean sender){
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setUserId(userId);
        chatMessage.setMessage(message);
        chatMessage.setSender(sender);
        chatMessage.setTimestamp(LocalDateTime.now());

        chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getChatHistory(Long userId) {
        return chatMessageRepository.findByUserId(userId);
    }
}
