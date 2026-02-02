package com.skull.logbook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Paths;

import io.github.cdimascio.dotenv.Dotenv;

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

		// .env 파일의 키가 소문자인 경우(db.host)와 대문자인 경우(DB_HOST) 모두 대응
		setIfAbsent("DB_HOST", getEnvOr(dotenv, "DB_HOST", "db.host"));
		setIfAbsent("DB_PORT", getEnvOr(dotenv, "DB_PORT", "db.port"));
		setIfAbsent("DB_NAME", getEnvOr(dotenv, "DB_NAME", "db.name"));
		setIfAbsent("DB_USERNAME", getEnvOr(dotenv, "DB_USERNAME", "db.username"));
		setIfAbsent("DB_PASSWORD", getEnvOr(dotenv, "DB_PASSWORD", "db.password"));

		setIfAbsent("SFTP_HOST", getEnvOr(dotenv, "SFTP_HOST", "sftp.host"));
		setIfAbsent("SFTP_PORT", getEnvOr(dotenv, "SFTP_PORT", "sftp.port"));
		setIfAbsent("SFTP_USERNAME", getEnvOr(dotenv, "SFTP_USERNAME", "sftp.username"));
		setIfAbsent("SFTP_PASSWORD", getEnvOr(dotenv, "SFTP_PASSWORD", "sftp.password"));
		setIfAbsent("SFTP_UPLOADPATH", getEnvOr(dotenv, "SFTP_UPLOADPATH", "sftp.uploadPath"));
	}

	private static String getEnvOr(Dotenv dotenv, String key1, String key2) {
		String val = dotenv.get(key1);
		return (val != null) ? val : dotenv.get(key2);
	}

	private static void setIfAbsent(String key, String value) {
		if (value != null && !value.isBlank() && System.getProperty(key) == null) {
			System.setProperty(key, value.trim());
		}
	}
}
