package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "searchMetadata")
public class SearchMetadata extends BaseCreatedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "searchQuery", nullable = false, unique = true)
    private String searchQuery;

    @Column(name = "intent")
    private String intent;

    @Column(name = "translatedQuery")
    private String translatedQuery;

    @Column(name = "synonyms", columnDefinition = "TEXT")
    private String synonyms; // Comma separated

    @Column(name = "suggestedTags", columnDefinition = "TEXT")
    private String suggestedTags; // Comma separated

    @Column(name = "relatedTopics", columnDefinition = "TEXT")
    private String relatedTopics; // Comma separated

    @Column(name = "semanticWeightMap", columnDefinition = "TEXT")
    private String semanticWeightMap; // JSON string
}
