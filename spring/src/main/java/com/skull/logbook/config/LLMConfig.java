package com.skull.logbook.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class LLMConfig {

    @Value("${llm.google.api-key}")
    private String googleApiKey;

    @Value("#{'${llm.google.models}'.split(',')}")
    private java.util.List<String> googleModels;

    @Bean
    public WebClient googleWebClient() {
        return WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Bean
    public String googleApiKey() {
        return googleApiKey;
    }

    @Bean
    public java.util.List<String> googleModels() {
        return googleModels;
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Java 8 Date/Time 지원을 위해 모듈 등록
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
