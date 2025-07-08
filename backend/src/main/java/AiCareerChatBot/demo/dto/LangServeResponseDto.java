package AiCareerChatBot.demo.dto;

import lombok.Data;

import java.util.Map;

@Data
public class LangServeResponseDto {
    private Map<String, String> output;
}
