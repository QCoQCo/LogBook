package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "post")
public class Post extends BaseDeletedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "userId", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "isActive", nullable = false, columnDefinition = "tinyint(1) not null default 1")
    private Boolean isActive = true;

    @Builder.Default
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostTag> postTags = new ArrayList<>();

    @Override
    public void softDelete() {
        super.softDelete(); // 1. Post의 deletedAt 업데이트 (Soft Delete)

        if (this.postTags != null) {
            this.postTags.clear(); // 2. PostTag 리스트 비움 (Orphan Removal에 의한 Hard Delete)
        }
    }

    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public void setActive(Boolean active) {
        this.isActive = active != null ? active : true;
    }
}
