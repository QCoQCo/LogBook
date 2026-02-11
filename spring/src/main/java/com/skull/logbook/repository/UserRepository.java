package com.skull.logbook.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skull.logbook.constant.AuthProvider;
import com.skull.logbook.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginId(String loginId);

    Optional<User> findByUserEmail(String userEmail);

    boolean existsByLoginId(String loginId);

    boolean existsByNickName(String nickName);

    Optional<User> findByUserEmailAndNickName(String userEmail, String nickName);

    Optional<User> findByLoginIdAndUserEmailAndNickName(String loginId, String userEmail, String nickName);

    Optional<User> findByLoginIdAndUserEmail(String loginId, String userEmail);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}
