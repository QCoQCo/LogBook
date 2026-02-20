package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "userFollow", uniqueConstraints = @UniqueConstraint(columnNames = { "followerId", "followingId" }))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserFollow extends BaseCreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "followerId", nullable = false)
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "followingId", nullable = false)
    private User following;

    @Builder
    public UserFollow(User follower, User following) {
        this.follower = follower;
        this.following = following;
    }
}
