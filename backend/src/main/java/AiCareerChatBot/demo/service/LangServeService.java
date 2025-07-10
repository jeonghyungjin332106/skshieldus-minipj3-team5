package AiCareerChatBot.demo.service;

import AiCareerChatBot.demo.dto.LangServeResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LangServeService {

    private final WebClient webClient;

    public String getAIResponse(Long userId, String userMessage, Double temperature) {
        try {
            Map<String, Object> requestPayload = Map.of(
                    "userId", userId.toString(),
                    "userMessage", userMessage,
                    "temperature", temperature != null ? temperature : 0.0
            );

            return webClient.post()
                    .uri("/api/chat/ask")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestPayload)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .map(json -> json.get("aiResponse").asText())
                    .block();

        } catch (Exception e) {
            e.printStackTrace();
            return "죄송합니다. AI 응답에 실패했습니다.";
        }
    }
}