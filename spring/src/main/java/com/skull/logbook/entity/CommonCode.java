package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@AllArgsConstructor
@Table(name = "commonCode")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommonCode extends BaseDeletedEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupCode", referencedColumnName = "groupCode", nullable = false)
    private CommonCodeGroup codeGroup;

    @Id
    @Column(name = "codeValue", nullable = false, length = 50)
    private String codeValue;

    @Column(name = "codeName", nullable = false, length = 100)
    private String codeName;

    @Column(name = "sortOrder")
    private Integer sortOrder;

    @Column(name = "useYn", nullable = false, length = 1)
    private String useYn;
}
