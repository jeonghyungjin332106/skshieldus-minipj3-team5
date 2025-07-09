package AiCareerChatBot.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final WebClient webClient;

    public String handleResumeUpload(Long userId, MultipartFile file) {
        try {
            // 1. AI 서버로 이력서 파일 전송
            String result = sendResumeToAI(file);
            return "이력서 업로드 성공: " + result;

        } catch (Exception e) {
            e.printStackTrace();
            return "이력서 업로드 중 오류 발생: " + e.getMessage();
        }
    }

    private String sendResumeToAI(MultipartFile file) throws Exception {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();  // FastAPI 쪽에서 filename 필요
            }
        }).contentType(MediaType.APPLICATION_OCTET_STREAM);

        return webClient.post()
                .uri("/api/resume/upload")  // AI 서버 endpoint
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .block(); // 동기식 호출
    }
}
