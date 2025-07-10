// =======================================================================
// 파일 1: service/ResumeService.java
// [수정] AI 서버로 multipart/form-data를 전송할 때, 숫자 값을 문자열로 변환하여 안정성을 높입니다.
// =======================================================================
package AiCareerChatBot.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final WebClient webClient;

    public String handleResumeUpload(Long userId, MultipartFile file, int chunkSize, int chunkOverlap) {
        try {
            // AI 서버로 이력서 파일과 설정값들을 전송합니다.
            String result = sendResumeToAI(userId, file, chunkSize, chunkOverlap);
            return result; // AI 서버의 응답을 그대로 반환합니다.
        } catch (Exception e) {
            e.printStackTrace();
            // WebClient에서 발생한 예외를 더 명확하게 처리합니다.
            throw new RuntimeException("AI 서버와 통신 중 오류가 발생했습니다.", e);
        }
    }

    private String sendResumeToAI(Long userId, MultipartFile file, int chunkSize, int chunkOverlap) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        
        // 파일 파트 추가
        builder.part("file", file.getResource()).filename(file.getOriginalFilename());
        
        // [핵심 수정] 다른 데이터 파트들은 문자열(String)로 변환하여 추가합니다.
        // FastAPI의 Form 필드는 문자열 값을 기대하므로, 이 변환이 중요합니다.
        builder.part("userId", String.valueOf(userId));
        builder.part("chunkSize", String.valueOf(chunkSize));
        builder.part("chunkOverlap", String.valueOf(chunkOverlap));

        return webClient.post()
                .uri("/api/resume/upload") // AI 서버의 엔드포인트
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                // AI 서버에서 에러 응답이 왔을 때 더 상세한 로그를 남깁니다.
                .onStatus(
                    status -> status.isError(),
                    response -> response.bodyToMono(String.class)
                                        .flatMap(errorBody -> {
                                            System.err.println("AI 서버로부터 에러 응답 수신: " + errorBody);
                                            return Mono.error(new RuntimeException("AI 서버 오류: " + errorBody));
                                        })
                )
                .bodyToMono(String.class)
                .block(); // 동기식으로 응답을 기다림
    }
}