package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;

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

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nickName;

    @Column(nullable = false, unique = true)
    private String userEmail;

    private String profilePhoto;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @OneToOne(mappedBy = "user")
    private Blog blog;
}
