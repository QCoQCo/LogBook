package com.skull.logbook.controller;

import com.skull.logbook.dto.CommonCodeItemDto;
import com.skull.logbook.entity.CommonCode;
import com.skull.logbook.repository.CommonCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/common-codes")
@RequiredArgsConstructor
public class CommonCodeController {

    private final CommonCodeRepository commonCodeRepository;

    /** 관리자용: 전체 공통코드 목록 (그룹+코드 플랫). groupCode로 필터 가능 */
    @GetMapping
    public ResponseEntity<List<CommonCodeItemDto>> getCommonCodes(
            @RequestParam(required = false) String groupCode) {
        List<CommonCode> list = groupCode != null && !groupCode.isBlank()
                ? commonCodeRepository.findByGroupCodeOrderBySortOrder(groupCode.trim())
                : commonCodeRepository.findAllWithGroupOrderByGroupCodeAndSortOrder();
        List<CommonCodeItemDto> dtos = list.stream()
                .map(c -> new CommonCodeItemDto(
                        c.getCodeGroup().getGroupCode(),
                        c.getCodeGroup().getGroupName(),
                        c.getCodeValue(),
                        c.getCodeName(),
                        c.getSortOrder(),
                        c.getUseYn()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
