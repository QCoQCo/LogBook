package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity 
@Getter
@Setter
@Table(name = "posts")
public class posts extends BaseDeletedEntity {
    @Id
    @GeneratedVau(strategy = GenerationTypeprivate Long id;    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;
}
