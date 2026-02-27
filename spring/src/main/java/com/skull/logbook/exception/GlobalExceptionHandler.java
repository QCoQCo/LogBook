package com.skull.logbook.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.AuthenticationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of(
                "message", "업로드 파일 크기가 허용 한도를 초과했습니다. (최대 10MB)",
                "detail", e.getMessage() != null ? e.getMessage() : "Maximum upload size exceeded"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthenticationException(AuthenticationException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "아이디 또는 비밀번호가 올바르지 않습니다."));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<?> handleEntityNotFoundException(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "리소스를 찾을 수 없습니다."));
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
