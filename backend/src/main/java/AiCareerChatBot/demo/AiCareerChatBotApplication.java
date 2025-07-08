package AiCareerChatBot.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// --- [수정된 부분] ---
// 스프링 부트의 기본 사용자 자동 생성 기능을 비활성화합니다.
// 이렇게 해야 우리가 만든 SecurityConfig가 우선적으로 적용됩니다.
@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class AiCareerChatBotApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiCareerChatBotApplication.class, args);
    }

}
