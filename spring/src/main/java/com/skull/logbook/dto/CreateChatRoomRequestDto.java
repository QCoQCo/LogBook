package com.skull.logbook.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateChatRoomRequestDto {

    private String name;
    private String description;
    private Integer capacity;
    private Boolean isPrivate;
    private String password;
}
