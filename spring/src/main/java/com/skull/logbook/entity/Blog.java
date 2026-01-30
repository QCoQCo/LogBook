package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Getter
@Table(name = "blog")
public class Blog extends BaseDeletedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String layout;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "userId",
        nullable = false,
        unique = true
    )
    private User user;
}
