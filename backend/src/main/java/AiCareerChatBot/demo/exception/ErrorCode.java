package AiCareerChatBot.demo.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED,"C009","인증 정보 오류"),

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", " 유효하지 않은 입력 값입니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C002", " 지원하지 않는 메서드입니다."),
    ENTITY_NOT_FOUND(HttpStatus.NOT_FOUND, "C003", " 엔티티를 찾을 수 없습니다."), // Kept generic for fallback
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C004", "서버에서 오류가 발생했습니다."),
    INVALID_TYPE_VALUE(HttpStatus.BAD_REQUEST, "C005", " 유효하지 않은 형식의 값입니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "C006", " 접근 권한이 없습니다."), // Generic access denied
    // C007 Was "INVALID_CREDENTIALS" which is specific to auth.
    // Let's add a more general resource not found with arguments.
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "C008", "%s (을)를 찾을 수 없습니다. 식별자: %s"),


    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U002", " 존재하지 않는 사용자입니다. (식별자: %s)"), // Modified
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "U003", "비밀번호가 일치하지 않습니다."),
    LOGIN_REQUIRED(HttpStatus.UNAUTHORIZED, "U004", " 로그인이 필요합니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "U005", "유효하지 않은 토큰입니다."), // Generic invalid token
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "U006", "만료된 토큰입니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.NOT_FOUND, "U007", "리프레시 토큰을 찾을 수 없습니다."),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "U008", "만료된 리프레시 토큰입니다."),
    BLACKLISTED_TOKEN(HttpStatus.UNAUTHORIZED, "U009", "로그아웃 처리된 토큰입니다."),
    ALREADY_LOGGED_OUT(HttpStatus.BAD_REQUEST, "U010", "이미 로그아웃된 사용자입니다."),
    LOGIN_ID_ALREADY_EXISTS(HttpStatus.CONFLICT, "U011", "이미 사용 중인 로그인 ID입니다: %s"), // New
    USER_NOT_FOUND_BY_LOGIN_ID(HttpStatus.NOT_FOUND, "U00X", "로그인 ID '%s'에 해당하는 사용자를 찾을 수 없습니다."), // USER_NOT_FOUND와 코드 구분


    // Auth specific (for previously non-BusinessException cases)
    AUTH_UNEXPECTED_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "AU001", "%s 처리 중 예상치 못한 오류가 발생했습니다."), // New
    INVALID_REFRESH_TOKEN_DETAIL(HttpStatus.UNAUTHORIZED, "AU002", "유효하지 않거나 만료된 RefreshToken입니다."), // New
    UNAUTHORIZED_ACCESS(HttpStatus.UNAUTHORIZED, "AU003", "인증되지 않은 접근입니다."),
    INVALID_AUTHENTICATION_PRINCIPAL(HttpStatus.INTERNAL_SERVER_ERROR, "AU004", "유효하지 않은 인증 주체입니다."),



    // Chat
    CHATROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "CH001", "존재하지 않는 채팅방입니다. (ID: %s)"), // Modified
    CHAT_MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "CH002", "존재하지 않는 채팅 메시지입니다."),
    CANNOT_CHAT_WITH_SELF(HttpStatus.BAD_REQUEST, "CH003", "자기 자신과는 채팅할 수 없습니다."),
    CHAT_ROOM_ALREADY_EXISTS(HttpStatus.CONFLICT, "CH004", "이미 해당 사용자와의 채팅방이 존재합니다."),

    // Image & File
    IMAGE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "I001", "이미지 업로드에 실패했습니다."),
    IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "I002", "이미지를 찾을 수 없습니다. (식별자: %s)"), // Modified
    INVALID_FILE_FORMAT(HttpStatus.BAD_REQUEST, "I003", "잘못된 파일 형식입니다."),
    FILE_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "I004", "파일 업로드 중 오류가 발생했습니다."),
    MAX_UPLOAD_SIZE_EXCEEDED(HttpStatus.PAYLOAD_TOO_LARGE, "I005", "최대 업로드 파일 크기를 초과했습니다."),
    FILE_EMPTY(HttpStatus.BAD_REQUEST, "I006","File cannot be empty."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "I007","Failed to upload file."),
    FILE_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "I008","Failed to delete file.");


    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    public String formatMessage(Object... args) {
        return String.format(message, args);
    }
}