package com.skull.logbook.service;

import com.jcraft.jsch.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

@Slf4j
@Service
public class SftpService {

    @Value("${file.upload.host}")
    private String host;

    @Value("${file.upload.port}")
    private int port;

    @Value("${file.upload.username}")
    private String username;

    @Value("${file.upload.password}")
    private String password;

    @Value("${file.upload.uploadPath}")
    private String uploadPath;

    public String uploadFile(MultipartFile file, String subFolder, String userId) throws IOException {
        Session session = null;
        ChannelSftp channelSftp = null;

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String savedFilename = java.util.UUID.randomUUID().toString() + extension;
        // SFTP 서버 상의 저장 경로: uploadPath/{subFolder}/{userId}/
        String remoteDir = uploadPath + "/" + subFolder + "/" + userId;
        String remoteFilePath = remoteDir + "/" + savedFilename;

        System.out.println("=== SftpService.uploadFile Started ===");
        System.out.println("Host: " + host + ", Port: " + port);
        System.out.println("Username: " + username);
        System.out.println("Upload Path (Target): " + remoteFilePath);
        System.out.println("remoteDir: " + remoteDir);

        try {
            JSch jsch = new JSch();
            session = jsch.getSession(username, host, port);
            session.setPassword(password);

            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            channelSftp = (ChannelSftp) channel;

            // 디렉토리 생성 로직 수정 (상대경로/절대경로 모두 대응)
            // uploadPath + subFolder + userId 순서로 진입
            // "/"로 분리하여 한 단계씩 cd 시도 -> 실패 시 mkdir -> cd 반복

            String targetFullPath = uploadPath + "/" + subFolder + "/" + userId;
            // 경로 구분자 통일
            targetFullPath = targetFullPath.replace("\\", "/");
            String[] pathParts = targetFullPath.split("/");

            System.out.println("Processing path parts for: " + targetFullPath);

            for (String part : pathParts) {
                if (part.isEmpty())
                    continue; // 절대경로의 첫 부분 혹은 중복 슬래시 무시

                try {
                    channelSftp.cd(part);
                    System.out.println("cd success: " + part);
                } catch (SftpException e) {
                    System.out.println("cd failed for " + part + ", trying mkdir. Error: " + e.getMessage());
                    try {
                        channelSftp.mkdir(part);
                        channelSftp.cd(part);
                        System.out.println("mkdir & cd success: " + part);
                    } catch (SftpException mkdirEx) {
                        System.out.println("mkdir failed for " + part + ": " + mkdirEx.getMessage());
                        // 여기서 에러가 나면 멈추지 않고 진행해 볼 수도 있지만,
                        // 다음 경로로 진입 못하면 어차피 업로드 실패함.
                        throw new IOException("Failed to create directory: " + part, mkdirEx);
                    }
                }
            }

            // 파일 업로드
            try (InputStream inputStream = file.getInputStream()) {
                channelSftp.put(inputStream, savedFilename);
            }

            log.info("SFTP Upload Success: {}", remoteFilePath);

            // TODO: 실제 웹에서 접근 가능한 URL은 다를 수 있음.
            // 현재는 업로드 성공에 집중하고, 저장된 경로 정보를 반환
            // 프록시나 웹 서버 설정에 따라 URL 매핑 필요
            // 예: https://{host}/images/profile/{userId}/{filename}
            // 임시로 DB에는 파일명만 저장하거나, 규칙에 따른 URL을 저장해야 함.
            // 프론트엔드/백엔드 Context Path(/api) 일치를 위해 /api 추가
            return "/api/img/" + subFolder + "/" + userId + "/" + savedFilename;

        } catch (JSchException | SftpException e) {
            log.error("SFTP Upload Failure", e);
            throw new IOException("SFTP Upload Failure: " + e.getMessage());
        } finally {
            if (channelSftp != null) {
                channelSftp.disconnect();
            }
            if (session != null) {
                session.disconnect();
            }
        }
    }

    public byte[] downloadFile(String subFolder, String userId, String filename) throws IOException {
        Session session = null;
        ChannelSftp channelSftp = null;
        byte[] fileContent = null;

        // 경로: uploadPath/{subFolder}/{userId}/{filename}
        String targetFullPath = uploadPath + "/" + subFolder + "/" + userId + "/" + filename;
        targetFullPath = targetFullPath.replace("\\", "/");

        try {
            JSch jsch = new JSch();
            session = jsch.getSession(username, host, port);
            session.setPassword(password);

            Properties config = new Properties();
            config.put("StrictHostKeyChecking", "no");
            session.setConfig(config);
            session.connect();

            Channel channel = session.openChannel("sftp");
            channel.connect();
            channelSftp = (ChannelSftp) channel;

            try (InputStream inputStream = channelSftp.get(targetFullPath)) {
                fileContent = inputStream.readAllBytes();
            }

        } catch (JSchException | SftpException e) {
            log.error("SFTP Download Failure: " + targetFullPath, e);
            throw new IOException("파일 다운로드 실패: " + e.getMessage());
        } finally {
            if (channelSftp != null) {
                channelSftp.disconnect();
            }
            if (session != null) {
                session.disconnect();
            }
        }
        return fileContent;
    }
}
