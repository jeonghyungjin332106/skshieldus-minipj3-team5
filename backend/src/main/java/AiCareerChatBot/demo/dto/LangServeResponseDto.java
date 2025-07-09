package AiCareerChatBot.demo.dto;

import lombok.Data;

import java.util.Map;

@Data
public class LangServeResponseDto {
    private String aiResponse;

    public String getAiResponse() {
        return aiResponse;
    }

    public void setAiResponse(String aiResponse) {
        this.aiResponse = aiResponse;
    }
}