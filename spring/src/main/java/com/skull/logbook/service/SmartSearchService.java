package com.skull.logbook.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.dto.SearchResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.entity.SearchMetadata;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.CommonCodeRepository;
import com.skull.logbook.repository.PostRepository;
import com.skull.logbook.repository.PostTagRepository;
import com.skull.logbook.repository.SearchMetadataRepository;
import com.skull.logbook.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SmartSearchService {

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final UserRepository userRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final SearchMetadataRepository searchMetadataRepository;
    private final WebClient vllmWebClient;
    private final ObjectMapper objectMapper;
    private final String vllmModelName;

    @Autowired
    public SmartSearchService(PostRepository postRepository,
            PostTagRepository postTagRepository,
            UserRepository userRepository,
            CommonCodeRepository commonCodeRepository,
            SearchMetadataRepository searchMetadataRepository,
            WebClient vllmWebClient,
            ObjectMapper objectMapper,
            @Value("${llm.vllm.model-name}") String vllmModelName) {
        this.postRepository = postRepository;
        this.postTagRepository = postTagRepository;
        this.userRepository = userRepository;
        this.commonCodeRepository = commonCodeRepository;
        this.searchMetadataRepository = searchMetadataRepository;
        this.vllmWebClient = vllmWebClient;
        this.objectMapper = objectMapper;
        this.vllmModelName = vllmModelName;
    }

    public SearchResponseDto search(String query, int limit) {
        // 1. AI 분석 수행 (캐싱 포함)
        Map<String, Object> aiAnalysis = getAiSearchAnalysis(query);

        // 2. 검색 대상 키워드 결정
        // AI가 번역한 쿼리("React")가 있으면 그걸 쓰고, 없으면 원본 쿼리("리액트") 사용
        Object tqValue = (aiAnalysis != null) ? aiAnalysis.get("translatedQuery") : null;
        String translatedQuery = (tqValue != null) ? (String) tqValue : query;
        String searchTarget = (translatedQuery != null && !translatedQuery.isBlank()) ? translatedQuery : query;

        @SuppressWarnings("unchecked")
        List<String> synonyms = (aiAnalysis != null)
                ? (List<String>) aiAnalysis.getOrDefault("synonyms", new ArrayList<>())
                : new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<String> suggestedTags = (aiAnalysis != null)
                ? (List<String>) aiAnalysis.getOrDefault("suggestedTags", new ArrayList<>())
                : new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<String> relatedTopics = (aiAnalysis != null)
                ? (List<String>) aiAnalysis.getOrDefault("relatedTopics", new ArrayList<>())
                : new ArrayList<>();

        System.out.println("Original Query: " + query);
        System.out.println("Translated Query: " + translatedQuery);
        System.out.println("Search Target: " + searchTarget);
        System.out.println("Synonyms: " + synonyms);

        Set<Post> allPosts = new HashSet<>();
        Pageable pageable = PageRequest.of(0, limit);

        // 3. [Hybrid Logic] 확장 검색 수행 & Synonyms Batching
        allPosts.addAll(postRepository.findByTitleContainingOrContentContainingOrderByCreatedAtDesc(searchTarget,
                searchTarget, pageable));
        if (!translatedQuery.equalsIgnoreCase(searchTarget)) {
            allPosts.addAll(postRepository.findByTitleContainingOrContentContainingOrderByCreatedAtDesc(translatedQuery,
                    translatedQuery, pageable));
        }

        // Synonyms도 Batch로 처리하고 싶지만, LIKE %...% OR LIKE %...% 는 한계가 있어
        // 여기서는 가장 빈번한 쿼리인 태그/포스트 일괄 조회를 우선 적용함.
        // 추가 성능 필요시 Native Query (MATCH ... AGAINST) 사용 권장.
        for (String syn : synonyms) {
            allPosts.addAll(
                    postRepository.findByTitleContainingOrContentContainingOrderByCreatedAtDesc(syn, syn, pageable));
        }

        // 4. [Bulk Data Fetching] N+1 문제 해결을 위한 일괄 태그 조회
        List<Long> allPostIds = allPosts.stream().map(Post::getId).collect(Collectors.toList());
        List<Object[]> allTagData = postTagRepository.findTagsByPostIds(allPostIds);
        Map<Long, List<String>> allTagsMap = allTagData.stream()
                .collect(Collectors.groupingBy(
                        data -> (Long) data[0],
                        Collectors.mapping(data -> (String) data[1], Collectors.toList())));

        // 5. [Precision Scoring] 정합성 랭킹 알고리즘 적용 (Strict Threshold)
        // AI가 제안한 semanticWeightMap이 없으면 기본 50점, 있으면 온톨로지에 따라 더 엄격하게 필터링
        // [FIX] 250 → 50으로 낮춤 (너무 엄격해서 모든 게시물 제외됨)
        int strictThreshold = (aiAnalysis != null && aiAnalysis.containsKey("semanticWeightMap")) ? 50 : 30;

        List<PostWithScore> scoredPosts = allPosts.stream()
                .map(post -> new PostWithScore(post,
                        calculateRepresentativeScore(post, searchTarget, suggestedTags, aiAnalysis,
                                allTagsMap.getOrDefault(post.getId(), Collections.emptyList()))))
                .peek(p -> System.out.println("[Score] Post: " + p.post.getTitle() + " -> " + p.score)) // DEBUG
                .filter(p -> p.score >= strictThreshold) // [DSW Strict Filter]
                .filter(p -> p.score > -1000) // [Safety] Clash (-2000) 발생 시 절대 노출 금지
                .sorted(Comparator.comparing(PostWithScore::getScore).reversed())
                .limit(5) // [User Requirement] 상위 5개만 노출
                .collect(Collectors.toList());

        List<Post> finalPosts = scoredPosts.stream().map(p -> p.post).collect(Collectors.toList());
        List<PostResponseDto> postDtos = toPostResponseDtos(finalPosts);

        // 6. [Hybrid Tag Recommendation] (User Requirement: Max 6)
        List<String> finalSuggestedTags = new ArrayList<>();
        int totalResults = finalPosts.size();

        // [Logic] 검색 결과 수에 따른 유동적 태그 노출
        // Min(6, Max(3, Total / 2)) -> 3~6개 노출
        int displayLimit = Math.min(6, Math.max(3, totalResults / 2));
        // [FIX] 결과가 적을 때(5개 미만)는 빈도수 1이어도 노출, 많으면 30% or 최소 3회
        int minFrequency = (totalResults < 5) ? 1 : Math.max(3, (int) (totalResults * 0.3));

        // 1) DB 빈도 분석 (High Frequency)
        Map<String, Long> tagFrequency = allTagsMap.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.groupingBy(t -> t, Collectors.counting()));

        List<String> highFreqTags = tagFrequency.entrySet().stream()
                .filter(e -> e.getValue() >= minFrequency)
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(displayLimit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        finalSuggestedTags.addAll(highFreqTags);

        // 2) AI Backfill (부족하면 채우기)
        if (finalSuggestedTags.size() < displayLimit) {
            System.out.println("Backfill activated for Suggested Tags: " + (displayLimit - finalSuggestedTags.size())
                    + " needed.");
            for (String aiTag : suggestedTags) {
                if (finalSuggestedTags.size() >= displayLimit)
                    break;
                boolean exists = finalSuggestedTags.stream().anyMatch(t -> t.equalsIgnoreCase(aiTag));
                if (!exists) {
                    finalSuggestedTags.add(aiTag);
                }
            }
        }

        // 7. [Related Topics] (User Requirement: Max 5)
        // Min(5, Max(3, Total / 2)) -> 3~5개 노출
        int relatedLimit = Math.min(5, Math.max(3, totalResults / 2));

        // 1) DB Frequency (Minus Suggested)
        List<String> dbRelatedTopics = extractRelatedTagsFromData(allTagData, finalSuggestedTags, relatedLimit);
        List<String> finalRelatedTopics = new ArrayList<>(dbRelatedTopics);

        // 2) AI Backfill (부족하면 채우기)
        if (finalRelatedTopics.size() < relatedLimit) {
            System.out.println("Backfill activated for Related Topics");
            for (String topic : relatedTopics) {
                if (finalRelatedTopics.size() >= relatedLimit)
                    break;
                boolean exists = finalRelatedTopics.stream().anyMatch(t -> t.equalsIgnoreCase(topic));
                if (!exists)
                    finalRelatedTopics.add(topic);
            }
        }

        return new SearchResponseDto(
                postDtos,
                finalSuggestedTags,
                finalRelatedTopics,
                postDtos.stream().limit(3).collect(Collectors.toList()),
                "AI_PRECISE_RANKING_V3");
    }

    private static class PostWithScore {
        final Post post;
        final int score;

        PostWithScore(Post post, int score) {
            this.post = post;
            this.score = score;
        }

        int getScore() {
            return score;
        }
    }

    private int calculateRepresentativeScore(Post post, String query, List<String> suggestedTags,
            Map<String, Object> aiAnalysis, List<String> postTags) {
        String intent = (aiAnalysis != null) ? (String) aiAnalysis.getOrDefault("intent", "LEARNING") : "LEARNING";
        int score = 0;
        String title = post.getTitle().toLowerCase();
        String content = post.getContent().toLowerCase();
        String lowQuery = query.toLowerCase();

        // 0. 강제 배제 (Noise Removal)
        if (title.contains("[error case]") || title.contains("테스트용"))
            return -9999;

        // 1. 태그 일치 점수 (Intent Tag Priority)
        boolean hasPrimaryTag = false;
        if (suggestedTags != null && !suggestedTags.isEmpty()) {
            String primaryTag = suggestedTags.get(0).toLowerCase(); // AI가 판단한 핵심 태그 (예: react)

            for (String tag : postTags) {
                String lowTag = tag.toLowerCase();

                // 핵심 태그가 있는지 확인
                if (lowTag.equals(primaryTag)) {
                    hasPrimaryTag = true;
                    score += 500; // 핵심 태그 일치 시 가산점
                } else if (suggestedTags.contains(lowTag)) {
                    score += 100; // 그 외 추천 태그 일치
                }
            }
        }

        // 2. 제목 검색 (String Match) - Smart Filtering 적용
        if (title.contains(lowQuery)) {
            // [Precision] 짧은 검색어(3글자 이하)의 경우, 부분 일치(Substring)가 아닌 단어 단위 일치(Word Boundary)
            // 확인
            // [Fix] "C#", "C++", ".env" 등 특수문자 포함 단어를 위해 \b 대신 Lookaround 사용
            // (?<!\w) : 앞글자가 Word 문자(\w)가 아니어야 함 (즉, 공백/특수문자/문장시작)
            // (?!\w) : 뒷글자가 Word 문자(\w)가 아니어야 함 (즉, 공백/특수문자/문장끝)
            boolean isShortQuery = lowQuery.length() <= 3;
            boolean isWordMatch = true;
            if (isShortQuery) {
                // LowQuery 자체를 정규식 escape 처리 후 Lookaround 적용
                // [Fix] DOTALL (?s) 추가: 제목에 개행문자가 포함되어도 매칭되도록 수정
                isWordMatch = title.matches("(?s).*(?<!\\w)" + Pattern.quote(lowQuery) + "(?!\\w).*");
            }

            if (isShortQuery && !isWordMatch) {
                // 부분 일치(Noise)로 판명되면 감점 (예: "venv"에 "env"가 포함된 경우)
                System.out.println(
                        "  -> [Precision] Partial substring match rejected: '" + lowQuery + "' in '" + title + "'");
                score -= 200;
            } else {
                // [FIX] 태그가 없는 게시물은 페널티 대신 제목 일치 보너스
                if (postTags.isEmpty()) {
                    // 태그가 없는 게시물 → 제목 일치만으로 점수 부여
                    score += 150;
                } else if (!suggestedTags.isEmpty() && !hasPrimaryTag) {
                    // [Smart Filter] AI가 핵심 태그를 제안했으나 게시글에 없는 경우 페널티
                    score -= 300;
                } else {
                    score += 50; // 정상적인 제목 일치
                    if (title.equals(lowQuery))
                        score += 300;
                    else
                        score += 150;
                }
            }
        } else if (content.contains(lowQuery)) {
            // [Content Search] 제목에 없지만 본문에 있는 경우 (점수 부여)
            // [Fix] Content에도 동일한 Precision (Lookaround) 로직 적용
            boolean isShortQuery = lowQuery.length() <= 3;
            // [Fix] DOTALL (?s) 추가: 본문에 개행문자가 포함되어도 매칭되도록 수정
            boolean isWordMatch = content.matches("(?s).*(?<!\\w)" + Pattern.quote(lowQuery) + "(?!\\w).*");

            if (isShortQuery && !isWordMatch) {
                // 부분 일치(Noise) → 점수 없음
                System.out
                        .println("  -> [Precision] Content substring match rejected: '" + lowQuery + "' in content");
            } else {
                // 본문 일치 시 기본 점수 부여 (Threshold 30/50 통과 가능하도록)
                score += 50;
            }
        }

        // 3. 동적 의미론적 가중치 (Dynamic Semantic Weighting - DSW)
        // AI가 분석한 온톨로지 맵을 사용하여 기술 간 관계(동질, 종속, 생계, 적대)를 점수에 반영
        @SuppressWarnings("unchecked")
        Map<String, Double> rawMap = (aiAnalysis != null && aiAnalysis.containsKey("semanticWeightMap"))
                ? (Map<String, Double>) aiAnalysis.get("semanticWeightMap")
                : Collections.emptyMap();

        // [Normalization] 모든 키를 소문자로 정규화하여 대소문자 무관하게 비교 가능하도록 처리
        Map<String, Double> semanticMap = new HashMap<>();
        rawMap.forEach((k, v) -> semanticMap.put(k.toLowerCase(), v));

        // [DSW Title Analysis] 제목에서 semanticWeightMap 용어 기반으로 점수 조정
        boolean hasClashInTitle = false;
        boolean hasIdentityInTitle = false;
        for (Map.Entry<String, Double> entry : semanticMap.entrySet()) {
            String term = entry.getKey(); // 이미 소문자
            double weight = entry.getValue();
            if (title.contains(term)) {
                if (weight <= -0.5) {
                    // Clash 기술(-1.0)이 제목에 있으면 강력한 페널티
                    score += (int) (weight * 3000);
                    hasClashInTitle = true;
                } else if (weight >= 0.8) {
                    // Identity/Dependency 기술(1.0, 0.8)이 제목에 있으면 보너스
                    score += (int) (weight * 500);
                    hasIdentityInTitle = true;
                }
            }
        }

        // [Clash Handling] 충돌 기술이 감지되었으나 명확한 의도(Identity)가 없으면 노출 차단
        if (hasClashInTitle && !hasIdentityInTitle) {
            System.out.println("  -> [DSW] Rejected by term clash: " + title);
            return -2000; // 절대 노출되지 않도록 강력한 탈락 점수
        }

        // 4. 의도 기반 가중치 (Intent Weighting)
        if ("TROUBLESHOOTING".equals(intent) && (title.contains("error") || title.contains("fix"))) {
            score += 100;
        }

        return score;
    }

    private List<String> extractRelatedTagsFromData(List<Object[]> allTagData, List<String> suggestions, int limit) {
        Map<String, Long> freq = allTagData.stream()
                .map(d -> (String) d[1])
                .filter(t -> !suggestions.contains(t))
                .collect(Collectors.groupingBy(t -> t, Collectors.counting()));

        return freq.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private Map<String, Object> getAiSearchAnalysis(String query) {
        // 1. [DB Cache Check] 주인님의 시간을 위해 DB 먼저 확인
        Optional<SearchMetadata> cached = searchMetadataRepository.findBySearchQuery(query);
        // [Architectural Fix] 캐시는 존재하나 DSW(semanticWeightMap) 정보가 없는 구버전 기록이면 무시하고 신규
        // 분석 수행
        if (cached.isPresent() && cached.get().getSemanticWeightMap() != null) {
            SearchMetadata meta = cached.get();
            System.out.println("Metadata Cache HIT! (Query: " + query + ")");
            try {
                Map<String, Object> result = new HashMap<>();
                result.put("intent", meta.getIntent());
                result.put("translatedQuery", meta.getTranslatedQuery()); // DB에서 가져옴
                result.put("synonyms",
                        meta.getSynonyms() != null ? Arrays.asList(meta.getSynonyms().split(",")) : new ArrayList<>());
                result.put("suggestedTags", meta.getSuggestedTags() != null
                        ? Arrays.asList(meta.getSuggestedTags().split(","))
                        : new ArrayList<>());
                result.put("relatedTopics", meta.getRelatedTopics() != null
                        ? Arrays.asList(meta.getRelatedTopics().split(","))
                        : new ArrayList<>());
                result.put("semanticWeightMap", meta.getSemanticWeightMap() != null
                        ? objectMapper.readValue(meta.getSemanticWeightMap(), Map.class)
                        : null);

                // Cache hit usually means it passed confidence check before
                result.put("confidence", 1.0);
                return result;
            } catch (Exception e) {
                System.err.println("Cache Read Error, fallback to AI");
            }
        }

        return getAiAnalysisForEvolution(query);
    }

    private Map<String, Object> getAiAnalysisForEvolution(String query) {
        // AI 분석을 위한 공통 로직 호출
        List<String> existingTags = commonCodeRepository.findAll().stream()
                .map(it -> it.getCodeName())
                .distinct()
                .limit(20)
                .collect(Collectors.toList());
        return getAiSearchAnalysisInternal(query, existingTags, false);
    }

    private Map<String, Object> getAiSearchAnalysisInternal(String query, List<String> existingTags, boolean isRetry) {
        // [Few-shot Prompt] Ultra-concise for 1024 token limit
        String prompt = String.format(
                "JSON ONLY. NO MARKDOWN.\n" +
                        "Ex: '리액트' -> {\"intent\":\"LEARNING\",\"translatedQuery\":\"React\",\"synonyms\":[\"ReactJS\"],\"suggestedTags\":[\"React\",\"JavaScript\"],\"relatedTopics\":[\"SPA\"],\"semanticWeightMap\":{\"React\":1.0,\"JavaScript\":0.8,\"Vue\":-1.0},\"confidence\":1.0}\n"
                        +
                        "Ex: '자바' -> {\"intent\":\"LEARNING\",\"translatedQuery\":\"Java\",\"synonyms\":[\"JDK\"],\"suggestedTags\":[\"Java\",\"Spring\"],\"relatedTopics\":[\"JVM\"],\"semanticWeightMap\":{\"Java\":1.0,\"Spring\":0.8,\"JavaScript\":-1.0},\"confidence\":1.0}\n"
                        +
                        "Query: '%s'\nTags: %s\nREQUIRED: semanticWeightMap",
                query, existingTags);

        // [Dynamic Token Calculation] VLLM Server Limit (1024)
        int MODEL_CONTEXT_LIMIT = 1024;
        int SAFETY_MARGIN = 50;
        int estimatedInputTokens = prompt.length() / 3;
        int dynamicMaxTokens = Math.max(150, MODEL_CONTEXT_LIMIT - estimatedInputTokens - SAFETY_MARGIN);
        System.out.println("[Token Calc] Input: ~" + estimatedInputTokens + " tokens, max_tokens: " + dynamicMaxTokens);

        Map<String, Object> requestBody = Map.of(
                "model", vllmModelName,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "max_tokens", dynamicMaxTokens,
                "temperature", 0.0,
                "frequency_penalty", 0.0);

        try {
            // [DEBUG] 요청 본문 로깅
            System.out.println("LLM Request Body: " + objectMapper.writeValueAsString(requestBody));

            Map<String, Object> response = vllmWebClient.post()
                    .uri("/v1/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .map(body -> {
                                        System.err.println("LLM 4xx Error Response: " + body);
                                        return new RuntimeException("LLM Error: " + body);
                                    }))
                    .bodyToMono(Map.class)
                    .map(res -> {
                        try {
                            List<Map<String, Object>> choices = (List<Map<String, Object>>) res.get("choices");
                            if (choices != null && !choices.isEmpty()) {
                                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                                String content = (String) message.get("content");
                                System.out.println("RAW AI Content: " + content);
                                return objectMapper.readValue(content, Map.class);
                            }
                            return Collections.emptyMap();
                        } catch (Exception e) {
                            throw new RuntimeException("JSON Parse Error", e);
                        }
                    })
                    // [Optimization] Cold Start 등 환경에 따라 3.5s도 부족함 -> 5.0s로 최종 조정 (Trade-off)
                    .timeout(java.time.Duration.ofMillis(5000))
                    .doOnError(e -> System.out.println("AI Search Timeout or Error: " + e.getMessage()))
                    .onErrorReturn(Map.of("_error", "timeout")) // Fallback to basic search with marker
                    .block();

            // [Schema Evolution] Save to DB
            if (response != null && !response.isEmpty()) {
                // [Optimization] Timeout 발생 시 재시도 없이 즉시 Basic Search로 전환 (Latency 보장)
                if (response.containsKey("_error")) {
                    System.out.println("AI Search Skipped due to Timeout/Error. Returning basic search results.");
                    return Collections.emptyMap();
                }

                System.out.println("AI Analysis Success -> Saving to Metadata Cache");
                try {
                    // Retry Logic: If AI returns incomplete/invalid JSON (confidence low or missing
                    // key), retry once
                    if (!response.containsKey("translatedQuery") && !isRetry) {
                        // Retry with same timeout
                        System.out.println("AI Response is missing translatedQuery. Retrying once...");
                        return getAiSearchAnalysisInternal(query, existingTags, true);
                    }

                    SearchMetadata meta;
                    Optional<SearchMetadata> existing = searchMetadataRepository.findBySearchQuery(query);
                    if (existing.isPresent()) {
                        System.out.println("Metadata Cache Update: " + query);
                        meta = existing.get();
                        meta.setIntent((String) response.get("intent"));
                        meta.setTranslatedQuery((String) response.getOrDefault("translatedQuery", query)); // 저장
                        List<String> synonyms = (List<String>) response.get("synonyms");
                        List<String> suggestedTags = (List<String>) response.get("suggestedTags");
                        List<String> relatedTopics = (List<String>) response.get("relatedTopics");

                        meta.setSynonyms(String.join(",", synonyms));
                        meta.setSuggestedTags(String.join(",", suggestedTags));
                        meta.setRelatedTopics(String.join(",", relatedTopics));
                        meta.setSemanticWeightMap(response.containsKey("semanticWeightMap")
                                ? objectMapper.writeValueAsString(response.get("semanticWeightMap"))
                                : null);
                    } else {
                        meta = SearchMetadata.builder()
                                .searchQuery(query)
                                .intent((String) response.get("intent"))
                                .translatedQuery((String) response.getOrDefault("translatedQuery", query)) // 저장
                                .synonyms(String.join(",", (List<String>) response.get("synonyms")))
                                .suggestedTags(String.join(",", (List<String>) response.get("suggestedTags")))
                                .relatedTopics(String.join(",", (List<String>) response.get("relatedTopics")))
                                .semanticWeightMap(response.containsKey("semanticWeightMap")
                                        ? objectMapper.writeValueAsString(response.get("semanticWeightMap"))
                                        : null)
                                .build();
                    }
                    searchMetadataRepository.save(meta);
                } catch (Exception e) {
                    System.err.println("DB Save Failed: " + e.getMessage());
                }
            }

            return response != null ? response : Collections.emptyMap();
        } catch (Exception e) {
            System.err.println("LLM Error: " + e.getMessage());
            return Collections.emptyMap(); // Fallback
        }
    }

    private List<PostResponseDto> toPostResponseDtos(List<Post> posts) {
        // 1. 태그 일괄 조회
        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        List<Object[]> tagData = postTagRepository.findTagsByPostIds(postIds);

        Map<Long, List<String>> tagsMap = tagData.stream()
                .collect(Collectors.groupingBy(
                        data -> (Long) data[0],
                        Collectors.mapping(data -> (String) data[1], Collectors.toList())));

        // 3. 작성자 닉네임 조회
        List<Long> userIds = posts.stream().map(Post::getUserId).distinct().toList();
        Map<Long, String> authorNameMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getNickName, (a, b) -> a));

        return posts.stream()
                .map(post -> new PostResponseDto(
                        post.getId(),
                        String.valueOf(post.getUserId()),
                        authorNameMap.getOrDefault(post.getUserId(), ""), // authorName 추가
                        post.getTitle(),
                        post.getContent(),
                        post.getCreatedAt().toString(),
                        post.getUpdatedAt().toString(),
                        tagsMap.getOrDefault(post.getId(), new ArrayList<>())))
                .collect(Collectors.toList());
    }
}
