package com.skull.logbook.repository;

import com.skull.logbook.entity.CommonCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommonCodeRepository extends JpaRepository<CommonCode, String> {

    /** 태그 명칭으로 공통 코드 단건 조회 */
    Optional<CommonCode> findByCodeName(String codeName);

    /** 채번을 위한 최댓값 조회 (T + 숫자 형태) */
    @Query(value = "SELECT MAX(CAST(SUBSTRING(c.codeValue, 2) AS UNSIGNED)) " +
            "FROM commonCode c WHERE c.groupCode = :groupCode",
            nativeQuery = true)
    Integer findMaxNumericValueByGroupCode(@Param("groupCode") String groupCode);

    @Query("SELECT c.codeName FROM CommonCode c WHERE c.codeGroup.groupCode = :groupCode AND c.useYn = 'Y'")
    List<String> findCodeNamesByGroupCode(@Param("groupCode") String groupCode);

    /** 관리자용: 삭제되지 않은 전체 공통코드 (그룹 정보 포함, 그룹코드·정렬순) */
    @Query("SELECT c FROM CommonCode c JOIN FETCH c.codeGroup g WHERE c.deletedAt IS NULL AND g.deletedAt IS NULL ORDER BY g.groupCode, c.sortOrder")
    List<CommonCode> findAllWithGroupOrderByGroupCodeAndSortOrder();

    /** 그룹코드로 공통코드 조회 (역할 등) */
    @Query("SELECT c FROM CommonCode c JOIN FETCH c.codeGroup g WHERE g.groupCode = :groupCode AND c.deletedAt IS NULL AND g.deletedAt IS NULL ORDER BY c.sortOrder")
    List<CommonCode> findByGroupCodeOrderBySortOrder(@Param("groupCode") String groupCode);
}
