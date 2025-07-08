package AiCareerChatBot.demo.exception.advice;

import AiCareerChatBot.demo.exception.BusinessException;
import AiCareerChatBot.demo.exception.ResourceNotFoundException;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class DefaultExceptionAdvice {

    @ExceptionHandler(ResourceNotFoundException.class)
    protected ProblemDetail handleException(ResourceNotFoundException e) {
        ProblemDetail problemDetail = ProblemDetail.forStatus(e.getHttpStatus());
        problemDetail.setTitle("Not Found");
        problemDetail.setDetail(e.getMessage());
        problemDetail.setProperty("errorCategory", "Generic");
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    // --- [복원된 코드] ---
    // BusinessException을 정상적으로 처리하는 핸들러
    @ExceptionHandler(BusinessException.class)
    protected ResponseEntity<ErrorObject> handleBusinessException(BusinessException e) {
        log.warn("BusinessException 발생: {}", e.getMessage());
        
        ErrorObject errorObject = new ErrorObject();
        errorObject.setStatusCode(HttpStatus.CONFLICT.value()); // 409 상태 코드
        errorObject.setMessage(e.getMessage());

        return new ResponseEntity<>(errorObject, HttpStatus.CONFLICT);
    }
    // --- [복원 끝] ---

    @ExceptionHandler(HttpMessageNotReadableException.class)
    protected ResponseEntity<Object> handleException(HttpMessageNotReadableException e) {
        Map<String, Object> result = new HashMap<>();
        result.put("message", e.getMessage());
        result.put("httpStatus", HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(result, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex) {

        log.error(ex.getMessage(), ex);

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult()
                .getAllErrors()
                .forEach((error) -> {
                    String fieldName = ((FieldError) error).getField();
                    String errorMessage = error.getDefaultMessage();
                    errors.put(fieldName, errorMessage);
                });

        ValidationErrorResponse response =
                new ValidationErrorResponse(
                        400,
                        "입력항목 검증 오류",
                        LocalDateTime.now(),
                        errors
                );
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    protected ResponseEntity<ErrorObject> handleException(RuntimeException e) {
        ErrorObject errorObject = new ErrorObject();
        errorObject.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorObject.setMessage(e.getMessage());
        log.error(e.getMessage(), e);
        return new ResponseEntity<>(errorObject, HttpStatusCode.valueOf(500));
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class ValidationErrorResponse {
        private int status;
        private String message;
        private LocalDateTime timestamp;
        private Map<String, String> errors;
    }
}