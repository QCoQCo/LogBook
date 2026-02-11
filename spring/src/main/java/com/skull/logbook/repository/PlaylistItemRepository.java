package com.skull.logbook.repository;

import com.skull.logbook.entity.PlaylistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlaylistItemRepository extends JpaRepository<PlaylistItem, Long> {
    List<PlaylistItem> findByPlayIdOrderBySeqAsc(Long playId);

    void deleteByPlayId(Long playId);
}
