package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Builder
@Table(name = "commonCodeGroup")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class CommonCodeGroup extends BaseDeletedEntity {

    @Id
    @Column(name = "groupCode", length = 20)
    private String groupCode;

    @Column(name = "groupName", nullable = false, length = 100)
    private String groupName;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "useYn", nullable = false, length = 1)
    private String useYn;

    @Column(name = "modifier", length = 50)
    private String modifier;

    @OneToMany(mappedBy = "codeGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CommonCode> codes = new ArrayList<>();

    public CommonCodeGroup(String groupCode, String groupName, String description, String useYn, LocalDateTime regDate,
            String modifier) {
        this.groupCode = groupCode;
        this.groupName = groupName;
        this.description = description;
        this.useYn = useYn;
        this.modifier = modifier;
    }
}
