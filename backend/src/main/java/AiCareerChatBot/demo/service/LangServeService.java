package AiCareerChatBot.demo.service;

import AiCareerChatBot.demo.dto.LangServeResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class LangServeService {

    private final WebClient webClient;

    public String getAIResponse(String userMessage) {
        try {
            return webClient.post()
                    .uri("/chat/invoke")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("input", Map.of("input", userMessage)))
                    .retrieve()
                    .bodyToMono(LangServeResponseDto.class)
                    .map(response -> response.getOutput().get("output"))
                    .block();
        } catch (Exception e) {
            return "죄송합니다. AI 응답에 실패했습니다.";
        }
    }
}
