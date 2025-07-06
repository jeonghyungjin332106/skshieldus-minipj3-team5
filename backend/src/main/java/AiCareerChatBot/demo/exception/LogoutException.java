package AiCareerChatBot.demo.exception;

public class LogoutException extends RuntimeException {
    public LogoutException(String message) {
        super(message);
    }
    
    public LogoutException(String message, Throwable cause) {
        super(message, cause);
    }
}