package com.skull.logbook.entity;

import jakarta.persistence.*;
import com.skull.logbook.constant.AuthProvider;
import com.skull.logbook.constant.Role;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@Entity
@Getter
@Table(name = "user")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseDeletedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String loginId;

    @Column // OAuth2 사용자는 비밀번호가 없을 수 있으므로 nullable 허용
    private String password;

    @Column(nullable = false)
    private String nickName;

    @Column(nullable = false, unique = true)
    private String userEmail;

    private String profilePhoto;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Blog blog;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    private String providerId; // 구글 등 소셜 플랫폼의 고유 ID

    public void updateProfile(String introduction, String profilePhoto, String nickName) {
        if (introduction != null) {
            this.introduction = introduction;
        }
        if (profilePhoto != null) {
            this.profilePhoto = profilePhoto;
        }
        if (nickName != null) {
            this.nickName = nickName;
        }
    }

    public void changePassword(String newPassword) {
        this.password = newPassword;
    }

    public void changeRole(Role role) {
        this.role = role;
    }

    public void updateUserEmail(String userEmail) {
        if (userEmail != null && !userEmail.isBlank()) {
            this.userEmail = userEmail;
        }
    }
}
