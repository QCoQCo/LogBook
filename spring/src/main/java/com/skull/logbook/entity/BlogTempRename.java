package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Getter
@Table(name = "blog")
public class BlogTempRename extends BaseDeletedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String layout;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id")
    private Users user;
}
