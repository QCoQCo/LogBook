FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

COPY build/libs/*.jar app.jar

EXPOSE 8080

RUN apk add --no-cache ffmpeg python3
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

ENTRYPOINT ["java", "-jar", "-Xms256m", "-Xmx1024m", "-Duser.timezone=Asia/Seoul", "app.jar"]