package AiCareerChatBot.demo.dto;

import AiCareerChatBot.demo.entity.ChatMessage;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ChatMessageDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotBlank(message = "메시지는 비어 있을 수 없습니다.")
        private String message;
        private String conversationId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long chatId;
        private Long userId;
        private boolean sender;
        private String message;
        private LocalDateTime timestamp;
        private String conversationId;

        public Response(String message, boolean sender, String conversationId) {
            this.message = message;
            this.sender = sender;
            this.conversationId = conversationId;
            this.timestamp = LocalDateTime.now();
        }

        public static Response fromEntity(ChatMessage chatMessage) {
            return Response.builder()
                    .chatId(chatMessage.getChatId())
                    .userId(chatMessage.getUserId())
                    .sender(chatMessage.isSender())
                    .message(chatMessage.getMessage())
                    .timestamp(chatMessage.getTimestamp())
                    .conversationId(chatMessage.getConversationId())
                    .build();
        }
    }
}