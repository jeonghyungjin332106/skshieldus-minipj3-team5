package AiCareerChatBot.demo.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private String message;
    private HttpStatus httpStatus;
    private ErrorCode errorCode;

    public BusinessException(String message) {
        this(message, HttpStatus.EXPECTATION_FAILED);
    }

    public BusinessException(String message, HttpStatus httpStatus) {
        this.message = message;
        this.httpStatus = httpStatus;
    }

    public BusinessException(ErrorCode errorCode, Object... args) {
        this.message = errorCode.formatMessage(args);
        this.httpStatus = errorCode.getHttpStatus();
        this.errorCode = errorCode; // ErrorCode 필드 초기화
    }
}