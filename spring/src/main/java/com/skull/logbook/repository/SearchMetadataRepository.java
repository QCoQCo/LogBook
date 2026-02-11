package com.skull.logbook.repository;

import com.skull.logbook.entity.SearchMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SearchMetadataRepository extends JpaRepository<SearchMetadata, Long> {
    Optional<SearchMetadata> findBySearchQuery(String searchQuery);
}
