package AiCareerChatBot.demo.dto;

import AiCareerChatBot.demo.entity.User;
import jakarta.validation.constraints.*;
import lombok.*;


public class UserDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SignUpRequest {
        @NotBlank(message = "로그인 ID는 필수입니다.")
        @Size(min = 4, max = 20, message = "로그인 ID는 4~20자 이내로 입력해야 합니다.")
        @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "로그인 ID는 영문과 숫자 조합만 가능합니다.")
        private String loginId;

        @NotBlank(message = "비밀번호는 필수입니다.")
        @Size(min = 8, max = 20, message = "비밀번호는 8~20자 이내로 입력해야 합니다.")
        @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[@#$%^&+=!]).*$",
                message = "비밀번호는 영문, 숫자, 특수문자를 각 1개 이상 포함해야 합니다.")
        private String password;

        @NotBlank(message = "이름은 필수입니다.")
        @Size(min = 2, max = 12, message = "이름은 2~12자 이내로 입력해야 합니다.")
        @Pattern(regexp = "^[가-힣a-zA-Z]+$", message = "이름은 한글과 영문만 가능합니다.")
        private String userName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank(message = "로그인 ID는 필수입니다.")
        private String loginId;

        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String loginId;
        private String userName;
        private Boolean isAdmin;

        public static Response fromEntity(User user) {
            return Response.builder()
                    .id(user.getUserId())
                    .loginId(user.getLoginId())
                    .userName(user.getUserName())
                    .isAdmin(user.getIsAdmin())
                    .build();
        }

        // 간단한 응답을 위한 fromEntity (필요한 필드만 포함)
        public static Response fromEntitySimple(User user) {
            return Response.builder()
                    .id(user.getUserId())
                    .userName(user.getUserName())
                    .build();
        }

        // 상태 응답을 위한 fromEntity (필요한 필드만 포함)
        public static Response fromEntityStatus(User user) {
            return Response.builder()
                    .id(user.getUserId())
                    .build();
        }
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        @Size(min = 2, max = 12, message = "이름은 2~12자 이내로 입력해야 합니다.")
        @Pattern(regexp = "^[가-힣a-zA-Z]+$", message = "이름은 한글과 영문만 가능합니다.")
        private String userName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusUpdateRequest {
        private Boolean isAdmin;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeleteRequest {
        @NotBlank(message = "비밀번호는 필수입니다.")
        private String password;
    }
}