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

    /** 관리자용: 삭제되지 않은 전체 공통코드 (그룹 정보 포함, 그룹코드·정렬순) */
    @Query("SELECT c FROM CommonCode c JOIN FETCH c.codeGroup g WHERE c.deletedAt IS NULL AND g.deletedAt IS NULL ORDER BY g.groupCode, c.sortOrder")
    List<CommonCode> findAllWithGroupOrderByGroupCodeAndSortOrder();

    /** 그룹코드로 공통코드 조회 (역할 등) */
    @Query("SELECT c FROM CommonCode c JOIN FETCH c.codeGroup g WHERE g.groupCode = :groupCode AND c.deletedAt IS NULL AND g.deletedAt IS NULL ORDER BY c.sortOrder")
    List<CommonCode> findByGroupCodeOrderBySortOrder(@Param("groupCode") String groupCode);
}
