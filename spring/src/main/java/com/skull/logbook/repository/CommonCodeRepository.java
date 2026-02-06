package com.skull.logbook.repository;

import com.skull.logbook.entity.CommonCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommonCodeRepository extends JpaRepository<CommonCode, String> {

    @Query("SELECT c.codeName FROM CommonCode c WHERE c.codeGroup.groupCode = :groupCode AND c.useYn = 'Y'")
    List<String> findCodeNamesByGroupCode(@Param("groupCode") String groupCode);
}
