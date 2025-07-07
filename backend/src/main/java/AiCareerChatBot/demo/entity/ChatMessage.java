package AiCareerChatBot.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_id")
    private Long chatId;

    @Column(name = "user_id", length = 20, nullable = false)
    private Long userId;

    @Column(name = "sender")
    private boolean sender;

    @Column(columnDefinition = "TEXT")
    private String message;

    private LocalDateTime timestamp;

    @Override
    public String toString() {
        return "Chat{" +
                "chatId=" + chatId +
                ", userId='" + userId + '\'' +
                ", sender='" + sender + '\'' +
                ", message='" + message + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChatMessage message = (ChatMessage) o;
        return chatId != null && chatId.equals(message.chatId);
    }
}
