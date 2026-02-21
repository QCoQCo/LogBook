package com.skull.logbook.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ImageDeleteRequestDto {
    private List<String> files;
    private String sessionId;
}
