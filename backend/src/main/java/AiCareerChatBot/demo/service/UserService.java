package AiCareerChatBot.demo.service;

import AiCareerChatBot.demo.dto.UserDto;
import AiCareerChatBot.demo.entity.User;
import AiCareerChatBot.demo.exception.BusinessException;
import AiCareerChatBot.demo.exception.ErrorCode;
import AiCareerChatBot.demo.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.geom.Area;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserDto.Response createUser(UserDto.SignUpRequest requestDto) {

        if (userRepository.existsByLoginId(requestDto.getLoginId())) {
            throw new BusinessException(ErrorCode.LOGIN_ID_ALREADY_EXISTS, requestDto.getLoginId());
        }


        User user = User.builder()
                .loginId(requestDto.getLoginId())
                .password(passwordEncoder.encode(requestDto.getPassword()))
                .userName(requestDto.getUserName())
                .isAdmin(false)
                .build();

        User savedUser = userRepository.save(user);
        return UserDto.Response.fromEntity(savedUser);
    }

    @Transactional(readOnly = true)
    public UserDto.Response getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, String.valueOf(userId)));
        return UserDto.Response.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public UserDto.Response getUserByUserName(String userName) {
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userName));
        return UserDto.Response.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public UserDto.Response getUserByLoginId(String loginId) {
        User user = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, loginId));
        return UserDto.Response.fromEntity(user);
    }

    // userId 기반 업데이트 메서드 (JWT 토큰용)
    @Transactional
    public UserDto.Response updateUser(Long userId, UserDto.UpdateRequest requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, String.valueOf(userId)));

        if (requestDto.getUserName() != null && !requestDto.getUserName().isEmpty()) {
            user.setUserName(requestDto.getUserName());
        }


        User updatedUser = userRepository.save(user);
        return UserDto.Response.fromEntity(updatedUser);
    }

    // username 기반 업데이트 메서드 (기존 호환성을 위해 유지)
    @Transactional
    public UserDto.Response updateUser(String username, UserDto.UpdateRequest requestDto) {
        User user = userRepository.findByUserName(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, username));

        if (requestDto.getUserName() != null && !requestDto.getUserName().isEmpty()) {
            user.setUserName(requestDto.getUserName());
        }

        User updatedUser = userRepository.save(user);
        return UserDto.Response.fromEntity(updatedUser);
    }

    @Transactional
    public UserDto.Response updateUserStatus(Long userId, UserDto.StatusUpdateRequest requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, String.valueOf(userId)));


        User updatedUser = userRepository.save(user);
        User finalUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + userId));
        return UserDto.Response.fromEntityStatus(finalUser);
    }

    // userId 기반 삭제 메서드 (JWT 토큰용)
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, String.valueOf(userId)));
        userRepository.delete(user);
    }

    @Transactional
    public void deleteUserWithPassword(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, String.valueOf(userId)));

        // 비밀번호 확인
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH, "비밀번호가 일치하지 않습니다.");
        }

        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto.Response> getAdminUsers() {
        List<User> adminUsers = userRepository.findByIsAdminTrue();
        return adminUsers.stream()
                .map(UserDto.Response::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isLoginIdAvailable(String loginId) {
        return !userRepository.existsByLoginId(loginId);
    }
}