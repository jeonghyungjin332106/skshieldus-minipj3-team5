package AiCareerChatBot.demo.repository;

import AiCareerChatBot.demo.dto.ConversationSummaryDto;
import AiCareerChatBot.demo.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByUserIdAndConversationIdOrderByTimestampAsc(Long userId, String conversationId);

    void deleteByUserIdAndConversationId(Long userId, String conversationId);

    @Query("SELECT new AiCareerChatBot.demo.dto.ConversationSummaryDto(" +
           "c.conversationId, " +
           "(SELECT c2.message FROM ChatMessage c2 WHERE c2.conversationId = c.conversationId AND c2.sender = true ORDER BY c2.timestamp ASC LIMIT 1), " + // 제목
           "(SELECT c3.message FROM ChatMessage c3 WHERE c3.conversationId = c.conversationId ORDER BY c3.timestamp DESC LIMIT 1), " + // 요약
           "MAX(c.timestamp)) " + // 마지막 업데이트 시간
           "FROM ChatMessage c WHERE c.userId = :userId " +
           "GROUP BY c.conversationId " +
           "ORDER BY MAX(c.timestamp) DESC")
    List<ConversationSummaryDto> findConversationSummariesByUserId(@Param("userId") Long userId);
}