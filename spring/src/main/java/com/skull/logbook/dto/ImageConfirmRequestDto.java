package com.skull.logbook.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ImageConfirmRequestDto {
    private String editId;
    private List<String> files;
}
