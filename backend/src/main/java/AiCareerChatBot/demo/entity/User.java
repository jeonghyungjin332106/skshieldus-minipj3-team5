package AiCareerChatBot.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.awt.geom.Area;
import java.util.Objects;


@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class User{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;


    @Column(name = "login_id", length = 20, nullable = false, unique = true)
    private String loginId;

    @Column(name = "password", length = 100, nullable = false)
    private String password;

    @Column(name = "user_name", length = 12, nullable = false)
    private String userName;

    @Column(name = "is_admin")
    private Boolean isAdmin;

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", loginId='" + loginId + '\'' +
                ", userName='" + userName + '\'' +
                ", isAdmin=" + isAdmin +
                '}';
    }

    @Override

    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return userId != null && userId.equals(user.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId); // userId 기반으로 hashCode 생성
    }
}