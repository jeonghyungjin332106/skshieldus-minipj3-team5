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
    private final LangServeService langServeService; // ✅ AI 서버 호출용 서비스 주입

    // 사용자 메시지 또는 AI 응답 저장
    public void saveChatMessage(Long userId, String message, boolean sender) {
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setUserId(userId);
        chatMessage.setMessage(message);
        chatMessage.setSender(sender);
        chatMessage.setTimestamp(LocalDateTime.now());

        chatMessageRepository.save(chatMessage);
    }

    // 사용자 전체 히스토리 조회
    public List<ChatMessage> getChatHistory(Long userId) {
        return chatMessageRepository.findByUserId(userId);
    }

    // ✅ AI 서버에 메시지를 보내고 응답받기
    public String getAIResponse(String userMessage) {
        return langServeService.getAIResponse(userMessage);
    }
}
