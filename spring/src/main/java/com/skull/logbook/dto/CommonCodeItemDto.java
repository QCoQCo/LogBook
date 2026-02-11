package com.skull.logbook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeItemDto {
    private String groupCode;
    private String groupName;
    private String codeValue;
    private String codeName;
    private Integer sortOrder;
    private String useYn;
}
