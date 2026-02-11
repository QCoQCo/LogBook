package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Builder
@Table(name = "blog")
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Blog extends BaseDeletedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String layout;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "userId",
        referencedColumnName = "id",
        nullable = false,
        unique = true
    )
    private User user;

    public void updateLayout(String layout) {
        if (layout == null || layout.isBlank()) {
            throw new IllegalArgumentException("레이아웃은 비어 있을 수 없습니다.");
        }
        this.layout = layout;
    }
}
