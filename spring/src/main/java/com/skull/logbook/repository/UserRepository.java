package com.skull.logbook.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skull.logbook.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginId(String loginId);

    Optional<User> findByUserEmail(String userEmail);

    boolean existsByLoginId(String loginId);

    boolean existsByNickName(String nickName);
}
