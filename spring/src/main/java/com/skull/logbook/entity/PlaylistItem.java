package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "playlist_item")
public class PlaylistItem extends BaseDeletedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long playId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String link;

    private String thumbnail;

    private Integer seq;

}
