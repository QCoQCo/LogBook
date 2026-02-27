# 실행 단계: Java 21 런타임 기반 실행
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# CI 환경(GitHub Actions)에서 빌드된 JAR 파일을 복사 (Gradle 빌드 결과물)
COPY build/libs/*.jar app.jar

# Spring Boot 포트 오픈
EXPOSE 8080

# 컨테이너 자원 사용 효율화를 위한 JVM 옵션 추가
# -Xms: 초기 힙 메모리, -Xmx: 최대 힙 메모리
ENTRYPOINT ["java", "-jar", "-Xms256m", "-Xmx512m", "-Duser.timezone=Asia/Seoul", "app.jar"]
