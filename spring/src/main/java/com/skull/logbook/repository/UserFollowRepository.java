package com.skull.logbook.repository;

import com.skull.logbook.entity.User;
import com.skull.logbook.entity.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    boolean existsByFollowerAndFollowing(User follower, User following);

    Optional<UserFollow> findByFollowerAndFollowing(User follower, User following);

    void deleteByFollowerAndFollowing(User follower, User following);

    @Query("SELECT uf.following.id FROM UserFollow uf WHERE uf.follower = :follower")
    List<Long> findFollowingIdsByFollower(@Param("follower") User follower);
}
