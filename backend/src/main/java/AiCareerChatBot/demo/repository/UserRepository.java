package AiCareerChatBot.demo.repository;

import AiCareerChatBot.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUserId(Long userId);
    Optional<User> findByUserName(String userName);
    Optional<User> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
    List<User> findByIsAdminTrue();
}