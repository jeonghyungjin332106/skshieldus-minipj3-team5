package AiCareerChatBot.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 대화 목록에 표시될 각 대화의 요약 정보를 담는 DTO입니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryDto {

    private String id; // 대화의 고유 ID

    private String title; // 대화의 제목 (예: 첫 번째 사용자 메시지)

    private String summary; // 대화의 요약 (예: 마지막 AI 메시지)

    private LocalDateTime createdAt; // 대화 생성 시간 또는 마지막 업데이트 시간

    // 필요에 따라 다른 필드를 추가할 수 있습니다.
    // 예: private int messageCount;
}