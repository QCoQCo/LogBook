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
}
