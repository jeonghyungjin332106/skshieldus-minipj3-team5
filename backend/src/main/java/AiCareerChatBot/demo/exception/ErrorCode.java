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


    // Product
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", " 존재하지 않는 상품입니다. (ID: %s)"), // Modified
    PRODUCT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "P002", "해당 상품에 대한 접근 권한이 없습니다."), // Generic access denied for product
    PRODUCT_ALREADY_RESERVED(HttpStatus.CONFLICT, "P003", "이미 예약된 상품입니다."),
    PRODUCT_ALREADY_SOLD(HttpStatus.CONFLICT, "P004", "이미 판매 완료된 상품입니다."),
    PRODUCT_CANNOT_BUMP(HttpStatus.BAD_REQUEST, "P005", "끌어올리기 가능 횟수를 초과했거나 조건을 만족하지 않습니다."), // Modified to be more general
    PRODUCT_NOT_AVAILABLE_FOR_TRADE(HttpStatus.BAD_REQUEST, "P006", "거래 불가능한 상품입니다. (예: 예약중, 판매완료)"),
    PRODUCT_ALREADY_COMPLETED(HttpStatus.CONFLICT, "P007", "이미 거래 완료 처리된 게시글입니다: %s"), // New
    PRODUCT_OPERATION_FORBIDDEN(HttpStatus.FORBIDDEN, "P008", "상품에 대한 '%s' 작업 권한이 없습니다."), // New (for update, delete, status change)


    // Chat
    CHATROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "CH001", "존재하지 않는 채팅방입니다. (ID: %s)"), // Modified
    CHAT_MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "CH002", "존재하지 않는 채팅 메시지입니다."),
    CANNOT_CHAT_WITH_SELF(HttpStatus.BAD_REQUEST, "CH003", "자기 자신과는 채팅할 수 없습니다."),
    CHAT_ROOM_ALREADY_EXISTS(HttpStatus.CONFLICT, "CH004", "이미 해당 사용자와의 채팅방이 존재합니다."),

    // Reservation
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "R001", "존재하지 않는 예약입니다. (ID: %s)"), // Modified
    RESERVATION_ALREADY_EXISTS(HttpStatus.CONFLICT, "R002", "이미 해당 상품(%s)에 대한 예약이 존재합니다."), // Modified
    RESERVATION_CANNOT_CANCEL(HttpStatus.BAD_REQUEST, "R003", "예약을 취소할 수 없는 상태입니다: %s"), // Modified to take reason
    CANNOT_RESERVE_OWN_PRODUCT(HttpStatus.BAD_REQUEST, "R004", "자신의 상품은 예약할 수 없습니다."),
    PRODUCT_NOT_RESERVABLE(HttpStatus.BAD_REQUEST, "R005", "예약할 수 없는 상품입니다: %s"), // Modified to take reason
    RESERVATION_ACTION_FORBIDDEN(HttpStatus.FORBIDDEN, "R006", "예약에 대한 '%s' 작업 권한이 없습니다."), // New
    RESERVATION_INVALID_STATE_FOR_ACTION(HttpStatus.BAD_REQUEST, "R007", "현재 예약 상태(%s)에서는 '%s' 작업을 수행할 수 없습니다."), // New
    RESERVATION_INVALID_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "R008", "유효하지 않은 예약 상태(%s)로 변경할 수 없습니다."), // New
    RESERVATION_DELETE_CONDITIONS_NOT_MET(HttpStatus.FORBIDDEN, "R009", "예약 삭제 조건을 만족하지 않습니다 (권한 또는 상태)."), // New


    // Dibs (찜)
    DIBS_ALREADY_EXISTS(HttpStatus.CONFLICT, "D001", "이미 찜한 상품입니다. (사용자 ID: %s, 상품 ID: %s)"), // Modified
    DIBS_NOT_FOUND(HttpStatus.NOT_FOUND, "D002", "찜하지 않은 상품입니다. (사용자 ID: %s, 상품 ID: %s)"), // Modified

    // Review
    DUPLICATE_REVIEW(HttpStatus.CONFLICT, "RV001","이미 후기를 작성하였습니다"),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "RV002", "존재하지 않는 리뷰입니다."),
    CANNOT_REVIEW_OWN_PRODUCT(HttpStatus.BAD_REQUEST, "RV003", "자신의 상품에는 리뷰를 작성할 수 없습니다."),
    TRADE_NOT_COMPLETED(HttpStatus.BAD_REQUEST, "RV004", "거래가 완료되지 않은 상품에는 리뷰를 작성할 수 없습니다."),
    REVIEW_ACCESS_DENIED(HttpStatus.FORBIDDEN, "RV005", "해당 리뷰에 대한 접근 권한이 없습니다."),
    TRADE_UNAUTHORIZED(HttpStatus.FORBIDDEN,"RV006", "해당 거래를 처리할 권한이 없습니다"),


    // Report
    REPORT_REASON_NOT_FOUND(HttpStatus.NOT_FOUND, "RP001", "존재하지 않는 신고 사유입니다."),
    REPORT_ALREADY_EXISTS(HttpStatus.CONFLICT, "RP002", "이미 신고한 내용입니다."),
    CANNOT_REPORT_SELF(HttpStatus.BAD_REQUEST, "RP003", "자기 자신을 신고할 수 없습니다."),
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "RP004", "존재하지 않는 신고입니다."),


    // Ban
    USER_ALREADY_BANNED(HttpStatus.CONFLICT, "B001", "이미 차단된 사용자입니다."),
    CANNOT_BAN_SELF(HttpStatus.BAD_REQUEST, "B002", "자기 자신을 차단할 수 없습니다."),
    USER_NOT_BANNED(HttpStatus.NOT_FOUND, "B003", "차단되지 않은 사용자입니다."),
    BAN_RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "B004", "존재하지 않는 차단 기록입니다."),


    // Area
    AREA_NOT_FOUND(HttpStatus.NOT_FOUND, "A001", "존재하지 않는 지역입니다. (ID: %s)"), // Modified

    // Category
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "CT001", "존재하지 않는 카테고리입니다. (식별자: %s)"), // Modified
    CATEGORY_NAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "CT002", "이미 존재하는 카테고리 이름입니다: %s"), // New

    // Notification
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "N001", "존재하지 않는 알림입니다."),

    // Image & File
    IMAGE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "I001", "이미지 업로드에 실패했습니다."),
    IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "I002", "이미지를 찾을 수 없습니다. (식별자: %s)"), // Modified
    INVALID_FILE_FORMAT(HttpStatus.BAD_REQUEST, "I003", "잘못된 파일 형식입니다."),
    FILE_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "I004", "파일 업로드 중 오류가 발생했습니다."),
    MAX_UPLOAD_SIZE_EXCEEDED(HttpStatus.PAYLOAD_TOO_LARGE, "I005", "최대 업로드 파일 크기를 초과했습니다."),
    FILE_EMPTY(HttpStatus.BAD_REQUEST, "I006","File cannot be empty."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "I007","Failed to upload file."),
    FILE_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "I008","Failed to delete file."),


    // Cancelation
    CANCELATION_REASON_NOT_FOUND(HttpStatus.NOT_FOUND, "CN001", "존재하지 않는 취소 사유입니다."),
    CANCELATION_NOT_FOUND(HttpStatus.NOT_FOUND, "CN002", "존재하지 않는 취소 기록입니다."),
    TRADE_NOT_FOUND(HttpStatus.NOT_FOUND, "CN003", "거래 정보를 찾을 수 없습니다. ID: %s"),

    // Complete
    COMPLETE_NOT_FOUND(HttpStatus.NOT_FOUND, "CP001", "존재하지 않는 거래 완료 기록입니다."),
    COMPLETE_RECORD_NOT_FOUND_BY_PRODUCT_ID(HttpStatus.NOT_FOUND, "CP002", "상품 ID %s에 해당하는 거래 완료 정보를 찾을 수 없습니다."); // New


    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    public String formatMessage(Object... args) {
        return String.format(message, args);
    }
}