package com.skull.logbook.repository;

import com.skull.logbook.entity.CommonCodeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommonCodeGroupRepository extends JpaRepository<CommonCodeGroup, String> {


}
