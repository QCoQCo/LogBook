package com.skull.logbook.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        e.printStackTrace();
        String msg = e.getMessage() != null ? e.getMessage() : "";
        // chat_room 스키마 이전 버전(userId varchar 등)이면 안내 메시지
        if (msg.contains("chat_room") || msg.contains("userId") || msg.contains("isSystem")
                || msg.contains("could not execute") || msg.contains("SQLException")) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "message",
                    "채팅방 테이블 스키마가 맞지 않을 수 있습니다. MySQL에서 다음을 실행한 뒤 앱을 재시작하세요: DROP TABLE IF EXISTS chat_room;",
                    "detail", msg));
        }
        return ResponseEntity.internalServerError().body(Map.of("message", "서버 내부 오류: " + msg));
    }
}
