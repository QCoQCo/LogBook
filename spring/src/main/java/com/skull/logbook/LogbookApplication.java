package com.skull.logbook;

import io.github.cdimascio.dotenv.Dotenv;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Paths;

import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class LogbookApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(LogbookApplication.class, args);
	}

	/**
	 * .env 파일을 로드하여 시스템 프로퍼티로 설정.
	 * application.yaml의 ${DB_HOST} 등이 이 값으로 치환됨.
	 */
	private static void loadEnv() {
		String baseDir = System.getProperty("user.dir");
		// spring 모듈에서 실행 시 프로젝트 루트의 .env 사용
		if (baseDir.endsWith("spring")) {
			baseDir = Paths.get(baseDir).getParent().toString();
		}
		Dotenv dotenv = Dotenv.configure()
				.directory(baseDir)
				.ignoreIfMissing()
				.load();

		setIfAbsent("DB_HOST", dotenv.get("DB_HOST"));
		setIfAbsent("DB_PORT", dotenv.get("DB_PORT"));
		setIfAbsent("DB_NAME", dotenv.get("DB_NAME"));
		setIfAbsent("DB_USERNAME", dotenv.get("DB_USERNAME"));
		setIfAbsent("DB_PASSWORD", dotenv.get("DB_PASSWORD"));
		setIfAbsent("SFTP_HOST", dotenv.get("SFTP_HOST"));
		setIfAbsent("SFTP_PORT", dotenv.get("SFTP_PORT"));
		setIfAbsent("SFTP_USERNAME", dotenv.get("SFTP_USERNAME"));
		setIfAbsent("SFTP_PASSWORD", dotenv.get("SFTP_PASSWORD"));
		setIfAbsent("SFTP_UPLOADPATH", dotenv.get("SFTP_UPLOAD_PATH"));
	}

	private static void setIfAbsent(String key, String value) {
		if (value != null && !value.isBlank() && System.getProperty(key) == null) {
			System.setProperty(key, value.trim());
		}
	}
}
