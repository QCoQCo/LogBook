package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 채팅방 메타정보. 시드/사용자 생성 모두 MySQL 관리. 메시지는 Firebase.
@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "chatRoom")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String admin;

    /** 생성자 loginId. 삭제 권한 체크용. */
    @Column(nullable = false)
    private String loginId;

    // 시드 방 여부. true면 삭제 불가.
    @Column(nullable = false)
    private Boolean isSystem;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Integer currentUsers;

    @Column(nullable = false)
    private Boolean isPrivate;

    @Column
    private String password;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
