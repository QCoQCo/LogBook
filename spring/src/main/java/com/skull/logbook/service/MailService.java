package com.skull.logbook.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired; // Explicit Autowired
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.util.Map;
import java.security.SecureRandom;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class MailService {
    private final JavaMailSender javaMailSender;

    // 생성자 주입 명시 확인
    public MailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
        log.info("MailService initialized with JavaMailSender: {}", javaMailSender.getClass().getName());
    }

    // 인증 코드 저장소 (Key: 이메일, Value: 인증코드|만료시간)
    private final Map<String, String> verificationCodeStorage = new ConcurrentHashMap<>();

    // 검증 토큰 저장소 (Key: 토큰, Value: 이메일|만료시간)
    private final Map<String, String> verificationTokenStorage = new ConcurrentHashMap<>();

    @Value("${spring.mail.username}")
    private String senderEmail;

    // 만료 시간: 10분 (밀리초) -> 코드 인증용
    private static final long CODE_EXPIRATION_TIME = 10 * 60 * 1000L;

    // 만료 시간: 10분 -> 토큰 유효용 (비밀번호 변경 등)
    private static final long TOKEN_EXPIRATION_TIME = 10 * 60 * 1000L;

    // 코드 1개당 허용되는 오답 횟수 (초과 시 코드 폐기 → 대입 공격 방지)
    private static final int MAX_VERIFY_ATTEMPTS = 5;

    // 같은 이메일로 재발송 가능한 최소 간격 (메일 폭탄 방지)
    private static final long RESEND_COOLDOWN = 60 * 1000L;

    // 오답 횟수 (Key: 이메일)
    private final Map<String, Integer> verifyAttempts = new ConcurrentHashMap<>();

    // 마지막 발송 시각 (Key: 이메일)
    private final Map<String, Long> lastSentAt = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * 인증 이메일 발송
     * 
     * @param toUrl 수신자 이메일
     * @return 생성된 인증 코드
     */
    public String sendAuthMail(String toUrl) {
        if (toUrl == null || toUrl.isBlank()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        purgeExpired();
        Long last = lastSentAt.get(toUrl);
        if (last != null && System.currentTimeMillis() - last < RESEND_COOLDOWN) {
            throw new IllegalArgumentException("잠시 후 다시 시도해주세요. (1분에 한 번 발송 가능)");
        }
        String authCode = createCode();

        try {
            MimeMessage message = createEmailForm(toUrl, authCode);
            javaMailSender.send(message);

            // 저장: 코드 + 만료시간
            long expireAt = System.currentTimeMillis() + CODE_EXPIRATION_TIME;
            verificationCodeStorage.put(toUrl, authCode + "|" + expireAt);
            verifyAttempts.remove(toUrl);
            lastSentAt.put(toUrl, System.currentTimeMillis());

            log.info("Auth mail sent to: {}", toUrl);
            return authCode;
        } catch (MessagingException e) {
            log.error("Failed to send email", e);
            throw new RuntimeException("메일 발송에 실패했습니다.");
        }
    }

    /**
     * 인증 코드 검증 및 토큰 발급
     *
     * @param email     이메일
     * @param inputCode 사용자가 입력한 코드
     * @return 검증 성공 시 토큰(UUID), 실패 시 null
     */
    public String verifyEmailCode(String email, String inputCode) {
        String storedValue = verificationCodeStorage.get(email);

        if (storedValue == null) {
            return null; // 요청된 적 없음
        }

        String[] parts = storedValue.split("\\|");
        String code = parts[0];
        long expireAt = Long.parseLong(parts[1]);

        // 1. 코드 일치 여부 확인 (오답 누적 시 코드 폐기)
        if (!code.equals(inputCode)) {
            int attempts = verifyAttempts.merge(email, 1, Integer::sum);
            if (attempts >= MAX_VERIFY_ATTEMPTS) {
                verificationCodeStorage.remove(email);
                verifyAttempts.remove(email);
                log.warn("인증 코드 오답 {}회 초과로 코드 폐기: {}", MAX_VERIFY_ATTEMPTS, email);
            }
            return null;
        }

        // 2. 만료 시간 확인
        if (System.currentTimeMillis() > expireAt) {
            verificationCodeStorage.remove(email); // 만료된 데이터 삭제
            return null;
        }

        // 인증 성공 후 데이터 삭제 (재사용 방지)
        verificationCodeStorage.remove(email);
        verifyAttempts.remove(email);

        // [New] 검증 토큰 발급 및 저장
        String token = UUID.randomUUID().toString();
        long tokenExpireAt = System.currentTimeMillis() + TOKEN_EXPIRATION_TIME;
        verificationTokenStorage.put(token, email + "|" + tokenExpireAt);

        log.info("Email verified. Token issued for: {}", email);
        return token;
    }

    /**
     * 토큰 검증 (비밀번호 변경용)
     *
     * @param token 발급된 토큰
     * @return 유효한 경우 이메일 반환, 아니면 null
     */
    public String verifyToken(String token) {
        String email = getVerifiedEmail(token);

        // 1회용 토큰이므로 사용 후 즉시 삭제 (선택적: 유지하려면 삭제 안 함)
        // 여기서는 보안을 위해 사용 후 삭제
        if (email != null) {
            consumeToken(token);
        }
        return email;
    }

    /**
     * 토큰을 소모하지 않고 인증된 이메일만 확인 (회원가입처럼 이후 단계가 실패할 수 있는 경우용)
     *
     * @return 유효한 경우 이메일, 아니면 null
     */
    public String getVerifiedEmail(String token) {
        if (token == null) {
            return null;
        }
        String storedValue = verificationTokenStorage.get(token);

        if (storedValue == null) {
            return null;
        }

        int sep = storedValue.lastIndexOf('|');
        String email = storedValue.substring(0, sep);
        long expireAt = Long.parseLong(storedValue.substring(sep + 1));

        if (System.currentTimeMillis() > expireAt) {
            verificationTokenStorage.remove(token);
            return null;
        }
        return email;
    }

    public void consumeToken(String token) {
        if (token != null) {
            verificationTokenStorage.remove(token);
        }
    }

    // 만료된 코드/토큰/발송 기록 정리 (메모리 누수 방지)
    private void purgeExpired() {
        long now = System.currentTimeMillis();
        verificationCodeStorage.entrySet().removeIf(e -> {
            String v = e.getValue();
            boolean expired = now > Long.parseLong(v.substring(v.lastIndexOf('|') + 1));
            if (expired) {
                verifyAttempts.remove(e.getKey());
            }
            return expired;
        });
        verificationTokenStorage.values().removeIf(v -> now > Long.parseLong(v.substring(v.lastIndexOf('|') + 1)));
        lastSentAt.values().removeIf(t -> now - t > RESEND_COOLDOWN);
    }

    private String createCode() {
        StringBuilder key = new StringBuilder();

        for (int i = 0; i < 6; i++) {
            key.append(secureRandom.nextInt(10));
        }
        return key.toString();
    }

    /**
     * 아이디 찾기 결과를 이메일로 발송 (응답으로 아이디를 노출하지 않기 위함)
     */
    public void sendLoginIdMail(String toEmail, String loginId) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(senderEmail);
            helper.setSubject("[LogBook] 아이디 찾기 안내");
            helper.setText("<div style='margin:10px;'>" +
                    "<h1> 아이디 찾기 </h1>" +
                    "<p>회원님의 아이디는 다음과 같습니다.</p>" +
                    "<div style='font-size:130%; font-weight:bold;'>" + HtmlUtils.htmlEscape(loginId) + "</div>" +
                    "</div>", true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send loginId email", e);
            throw new RuntimeException("메일 발송에 실패했습니다.");
        }
    }

    private MimeMessage createEmailForm(String toEmail, String authCode) throws MessagingException {
        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setFrom(senderEmail);
        helper.setSubject("[LogBook] 이메일 인증 번호입니다.");

        String content = "<div style='margin:10px;'>" +
                "<h1> 이메일 인증 번호 </h1>" +
                "<br>" +
                "<p>아래 6자리 인증번호를 입력해주세요.</p>" +
                "<br>" +
                "<div align='center' style='border:1px solid black; font-family:verdana;'>" +
                "<h3 style='color:blue;'>인증 번호</h3>" +
                "<div style='font-size:130%'>" + authCode + "</div>" +
                "</div>" +
                "<br/>" +
                "</div>";

        helper.setText(content, true); // html true
        return message;
    }
}
