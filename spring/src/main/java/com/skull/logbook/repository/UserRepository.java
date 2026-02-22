package com.skull.logbook.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.skull.logbook.constant.AuthProvider;
import com.skull.logbook.constant.Role;
import com.skull.logbook.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** 전체 사용자 목록용 (Blog N+1 방지 - User 엔티티 미로드) */
    @Query("SELECT u.id AS id, u.loginId AS loginId, u.nickName AS nickName, u.userEmail AS userEmail, u.profilePhoto AS profilePhoto, u.introduction AS introduction, u.role AS role FROM User u WHERE u.deletedAt IS NULL")
    List<UserListProjection> findAllForUserList();

    interface UserListProjection {
        Long getId();
        String getLoginId();
        String getNickName();
        String getUserEmail();
        String getProfilePhoto();
        String getIntroduction();
        Role getRole();
    }

    /** id, nickName만 조회 (Blog N+1 방지) */
    @Query("SELECT u.id AS id, u.nickName AS nickName FROM User u WHERE u.id IN :ids")
    List<UserIdNickNameProjection> findIdAndNickNameByIdIn(@Param("ids") List<Long> ids);

    interface UserIdNickNameProjection {
        Long getId();
        String getNickName();
    }

    Optional<User> findByLoginId(String loginId);

    Optional<User> findByUserEmail(String userEmail);

    boolean existsByLoginId(String loginId);

    boolean existsByNickName(String nickName);

    Optional<User> findByUserEmailAndNickName(String userEmail, String nickName);

    Optional<User> findByLoginIdAndUserEmailAndNickName(String loginId, String userEmail, String nickName);

    Optional<User> findByLoginIdAndUserEmail(String loginId, String userEmail);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}
