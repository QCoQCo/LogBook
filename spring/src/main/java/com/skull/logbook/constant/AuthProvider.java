package com.skull.logbook.constant;

import lombok.Getter;

@Getter
public enum AuthProvider {
    LOCAL("일반 가입"),
    GOOGLE("구글");

    private final String description;

    AuthProvider(String description) {
        this.description = description;
    }
}
