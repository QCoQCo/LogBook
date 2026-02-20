package com.skull.logbook.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.dto.SearchResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.entity.SearchMetadata;
import com.skull.logbook.repository.CommonCodeRepository;
import com.skull.logbook.repository.PostLikeRepository;
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

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SmartSearchService {

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final SearchMetadataRepository searchMetadataRepository;
    private final WebClient googleWebClient;
    private final ObjectMapper objectMapper;
    private final String googleApiKey;
    private final List<String> googleModels;

    @Autowired
    public SmartSearchService(PostRepository postRepository,
            PostTagRepository postTagRepository,
            PostLikeRepository postLikeRepository,
            UserRepository userRepository,
            CommonCodeRepository commonCodeRepository,
            SearchMetadataRepository searchMetadataRepository,
            WebClient googleWebClient,
            ObjectMapper objectMapper,
            String googleApiKey,
            java.util.List<String> googleModels) {
        this.postRepository = postRepository;
        this.postTagRepository = postTagRepository;
        this.postLikeRepository = postLikeRepository;
        this.userRepository = userRepository;
        this.commonCodeRepository = commonCodeRepository;
        this.searchMetadataRepository = searchMetadataRepository;
        this.googleWebClient = googleWebClient;
        this.objectMapper = objectMapper;
        this.googleApiKey = googleApiKey;
        this.googleModels = googleModels;
    }

    public SearchResponseDto search(String query, int page, int size, Boolean tagOnly, Boolean includeInactive) {
        // Tag 전용 검색
        if (Boolean.TRUE.equals(tagOnly)) {
            return searchByTagOnly(query, page, size, includeInactive);
        }

        // 기존 하이브리드 검색 로직
        // 1. AI 분석 수행 (캐싱 포함)
        Map<String, Object> aiAnalysis = getAiSearchAnalysis(query);

        // 2. 검색 대상 키워드 결정
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
        Pageable pageable = PageRequest.of(page, size);

        // 3. [Hybrid Logic] 확장 검색 수행 & Synonyms Batching
        boolean incInactive = Boolean.TRUE.equals(includeInactive);
        if (incInactive) {
            allPosts.addAll(postRepository.findByDeletedAtIsNullAndTitleContainingOrContentContainingOrderByCreatedAtDesc(
                    searchTarget, searchTarget, pageable));
            if (!translatedQuery.equalsIgnoreCase(searchTarget)) {
                allPosts.addAll(postRepository.findByDeletedAtIsNullAndTitleContainingOrContentContainingOrderByCreatedAtDesc(
                        translatedQuery, translatedQuery, pageable));
            }
            for (String syn : synonyms) {
                allPosts.addAll(postRepository.findByDeletedAtIsNullAndTitleContainingOrContentContainingOrderByCreatedAtDesc(
                        syn, syn, pageable));
            }
        } else {
            allPosts.addAll(postRepository.findByDeletedAtIsNullAndIsActiveTrueAndTitleContainingOrContentContainingOrderByCreatedAtDesc(
                    searchTarget, searchTarget, pageable));
            if (!translatedQuery.equalsIgnoreCase(searchTarget)) {
                allPosts.addAll(postRepository.findByDeletedAtIsNullAndIsActiveTrueAndTitleContainingOrContentContainingOrderByCreatedAtDesc(
                        translatedQuery, translatedQuery, pageable));
            }
            for (String syn : synonyms) {
                allPosts.addAll(postRepository.findByDeletedAtIsNullAndIsActiveTrueAndTitleContainingOrContentContainingOrderByCreatedAtDesc(
                        syn, syn, pageable));
            }
        }

        // 4. [Bulk Data Fetching] N+1 문제 해결을 위한 일괄 태그 조회
        List<Long> allPostIds = allPosts.stream().map(Post::getId).collect(Collectors.toList());
        List<Object[]> allTagData = postTagRepository.findTagsByPostIds(allPostIds);
        Map<Long, List<String>> allTagsMap = allTagData.stream()
                .collect(Collectors.groupingBy(
                        data -> (Long) data[0],
                        Collectors.mapping(data -> (String) data[1], Collectors.toList())));

        // 5. [Precision Scoring] 정합성 랭킹 알고리즘 적용 (Strict Threshold)
        int strictThreshold = (aiAnalysis != null && aiAnalysis.containsKey("semanticWeightMap")) ? 50 : 30;

        List<PostWithScore> scoredPosts = allPosts.stream()
                .map(post -> new PostWithScore(post,
                        calculateRepresentativeScore(post, searchTarget, suggestedTags, aiAnalysis,
                                allTagsMap.getOrDefault(post.getId(), Collections.emptyList()))))
                .peek(p -> System.out.println("[Score] Post: " + p.post.getTitle() + " -> " + p.score)) // DEBUG
                .filter(p -> p.score >= strictThreshold) // [DSW Strict Filter]
                .filter(p -> p.score > -1000) // [Safety] Clash (-2000) 발생 시 절대 노출 금지
                .sorted(Comparator.comparing(PostWithScore::getScore).reversed())
                // .limit(5) // [FIX] Pagination 적용으로 인해 limit 제거 (Pageable로 이미 제한됨)
                // 하지만 여러 쿼리 합치면서 size보다 커질 수 있으므로 다시 limit 적용 필요
                // 사실 pageable이 각 쿼리마다 적용되므로 합치면 size * N 개가 될 수 있음.
                // 정석대로라면 DB에서 정렬해야 하나 복잡하므로 메모리 정렬 후 상위 n개 자름.
                // 다음 페이지 처리가 완벽하진 않지만(중복/누락 가능성), 현재 구조상 최선.
                .limit(size)
                .collect(Collectors.toList());

        // [NEW] 검색 결과가 없을 때 CommonCode 기반 AI 추천 (첫 페이지일 때만)
        if (scoredPosts.isEmpty() && page == 0) {
            System.out.println("[Empty Result] No posts found for query: " + query);
            return handleEmptyResult(query);
        }

        List<Post> finalPosts = scoredPosts.stream().map(p -> p.post).collect(Collectors.toList());
        List<PostResponseDto> postDtos = toPostResponseDtos(finalPosts);

        // 6. [Hybrid Tag Recommendation] (User Requirement: Max 6)
        List<String> finalSuggestedTags = new ArrayList<>();
        int totalResults = finalPosts.size(); // 현재 페이지 기준이라 정확하진 않음

        // [Logic] 검색 결과 수에 따른 유동적 태그 노출
        int displayLimit = Math.min(6, Math.max(3, totalResults / 2));
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
        int relatedLimit = Math.min(5, Math.max(3, totalResults / 2));
        List<String> dbRelatedTopics = extractRelatedTagsFromData(allTagData, finalSuggestedTags, relatedLimit);
        List<String> finalRelatedTopics = new ArrayList<>(dbRelatedTopics);

        if (finalRelatedTopics.size() < relatedLimit) {
            for (String topic : relatedTopics) {
                if (finalRelatedTopics.size() >= relatedLimit)
                    break;
                boolean exists = finalRelatedTopics.stream().anyMatch(t -> t.equalsIgnoreCase(topic));
                if (!exists)
                    finalRelatedTopics.add(topic);
            }
        }

        // 3) [Ultimate Fallback] 여전히 부족하면 CommonCode에서 랜덤/유사 태그 추천 (페이지 0일때만 적극 추천?)
        // 일단 매 페이지마다 추천해도 무방
        if (finalRelatedTopics.isEmpty()) {
            try {
                List<String> allCommonTags = commonCodeRepository.findAll().stream()
                        .filter(cc -> cc.getCodeGroup() != null && "T".equals(cc.getCodeGroup().getGroupCode()))
                        .filter(cc -> "Y".equals(cc.getUseYn()))
                        .map(cc -> cc.getCodeName())
                        .filter(t -> !t.equalsIgnoreCase(searchTarget) && !finalSuggestedTags.contains(t))
                        .collect(Collectors.toList());

                Collections.shuffle(allCommonTags);
                for (String tag : allCommonTags) {
                    if (finalRelatedTopics.size() >= relatedLimit)
                        break;
                    finalRelatedTopics.add(tag);
                }
            } catch (Exception e) {
                System.err.println("Fallback failed: " + e.getMessage());
            }
        }

        return new SearchResponseDto(
                postDtos,
                finalSuggestedTags,
                finalRelatedTopics,
                postDtos.stream().limit(3).collect(Collectors.toList()),
                "AI_PRECISE_RANKING_V3");
    }

    /**
     * Tag 전용 검색 (AI 분석 없이 정확한 태그 매칭만)
     */
    private SearchResponseDto searchByTagOnly(String tagName, int page, int size, Boolean includeInactive) {
        System.out.println("[Tag Search] Searching for tag: " + tagName + ", page: " + page);

        // postTag JOIN으로 정확한 태그 매칭 (Pageable 적용)
        Pageable pageable = PageRequest.of(page, size);
        List<Post> posts = Boolean.TRUE.equals(includeInactive)
                ? postRepository.findByTagNameIncludeInactive(tagName, pageable)
                : postRepository.findByTagName(tagName, pageable);

        System.out.println("[Tag Search] Found posts: " + posts.size());

        List<PostResponseDto> postDtos = toPostResponseDtos(posts);

        // 메타데이터 저장 (첫 페이지일 때만 저장하거나 항상 저장? 일단 저장)
        if (page == 0) {
            saveSimpleMetadata(tagName, "TAG_SEARCH");
        }

        return new SearchResponseDto(
                postDtos,
                List.of(tagName), // suggestedTags: 검색한 태그 자체
                new ArrayList<>(), // relatedTopics: 비어있음
                postDtos.stream().limit(3).collect(Collectors.toList()), // recommendedPosts
                "TAG_SEARCH");
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

    /**
     * 태그를 구분자(/, -, 공백) 기준으로 토큰화
     * 예: "Java/DevOps" -> ["java", "devops"]
     */
    private List<String> tokenizeTag(String tag) {
        return Arrays.stream(tag.toLowerCase().split("[/\\-\\s]+"))
                .filter(t -> !t.isBlank())
                .collect(Collectors.toList());
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

        // 1. 태그 일치 점수 (Intent Tag Priority) - Special Character Support
        boolean hasPrimaryTag = false;
        if (suggestedTags != null && !suggestedTags.isEmpty()) {
            List<String> primaryTokens = tokenizeTag(suggestedTags.get(0));

            for (String tag : postTags) {
                List<String> tagTokens = tokenizeTag(tag);

                // 토큰 중 하나라도 일치하면 매칭으로 인정
                boolean hasMatchingToken = tagTokens.stream()
                        .anyMatch(token -> primaryTokens.contains(token));

                if (hasMatchingToken) {
                    hasPrimaryTag = true;
                    score += 500; // 핵심 태그 일치 시 가산점
                } else {
                    // 그 외 추천 태그들과 비교
                    boolean matchesOtherSuggested = suggestedTags.stream()
                            .skip(1) // primaryTag 제외
                            .flatMap(st -> tokenizeTag(st).stream())
                            .anyMatch(token -> tagTokens.contains(token));

                    if (matchesOtherSuggested) {
                        score += 100; // 그 외 추천 태그 일치
                    }
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

    /**
     * 검색 결과가 없을 때 CommonCode 태그 기반 AI 추천
     */
    private SearchResponseDto handleEmptyResult(String query) {
        try {
            // 1. CommonCode에서 전체 태그 조회 (groupCode = T)
            List<String> allTags = commonCodeRepository.findAll()
                    .stream()
                    .filter(cc -> cc.getCodeGroup() != null && "T".equals(cc.getCodeGroup().getGroupCode()))
                    .filter(cc -> "Y".equals(cc.getUseYn()))
                    .map(cc -> cc.getCodeName())
                    .collect(Collectors.toList());

            System.out.println("[Empty Result] All Tags Count: " + allTags.size());

            // 2. AI 프롬프트 구성
            String prompt = String.format(
                    "사용자가 '%s'를 검색했으나 관련 글이 없습니다. " +
                            "다음 태그 목록에서 검색어와 직접 관련된 태그 최대 5개(suggestedTags)와 " +
                            "같이 알면 좋은 태그 최대 5개(relatedTopics)를 추천해주세요.\n\n" +
                            "태그 목록: %s\n\n" +
                            "응답은 반드시 다음 JSON 형식으로만 작성하세요:\n" +
                            "{\n" +
                            "  \"suggestedTags\": [\"태그1\", \"태그2\"],\n" +
                            "  \"relatedTopics\": [\"태그A\", \"태그B\"]\n" +
                            "}",
                    query, allTags);

            // 3. AI 호출
            Map<String, Object> aiResponse = callGoogleAISimple(prompt);

            @SuppressWarnings("unchecked")
            List<String> suggestedTags = (aiResponse != null)
                    ? (List<String>) aiResponse.getOrDefault("suggestedTags", new ArrayList<>())
                    : new ArrayList<>();

            @SuppressWarnings("unchecked")
            List<String> relatedTopics = (aiResponse != null)
                    ? (List<String>) aiResponse.getOrDefault("relatedTopics", new ArrayList<>())
                    : new ArrayList<>();

            System.out.println("[Empty Result] Suggested Tags: " + suggestedTags);
            System.out.println("[Empty Result] Related Topics: " + relatedTopics);

            // 4. 메타데이터 저장 (AI 추천 태그 포함)
            saveEmptyResultMetadata(query, suggestedTags, relatedTopics);

            // 5. 빈 결과 반환 (posts는 비어있지만 태그는 추천)
            return new SearchResponseDto(
                    new ArrayList<>(), // posts: 빈 리스트
                    suggestedTags,
                    relatedTopics,
                    new ArrayList<>(), // recommendedPosts: 빈 리스트
                    "EMPTY_RESULT_WITH_AI_TAGS");
        } catch (Exception e) {
            System.err.println("[Empty Result] Error: " + e.getMessage());
            // 에러 발생 시 완전히 빈 결과 반환
            return new SearchResponseDto(
                    new ArrayList<>(),
                    new ArrayList<>(),
                    new ArrayList<>(),
                    new ArrayList<>(),
                    "EMPTY_RESULT_ERROR");
        }
    }

    /**
     * Google AI 단순 호출 (JSON 응답 파싱)
     */
    private Map<String, Object> callGoogleAISimple(String prompt) {
        for (int i = 0; i < googleModels.size(); i++) {
            String model = googleModels.get(i);
            try {
                System.out.println("Calling AI Model for empty result: " + model);

                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of(
                                "parts", List.of(Map.of("text", prompt)))));

                String response = googleWebClient.post()
                        .uri("/v1beta/models/" + model + ":generateContent?key=" + googleApiKey)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(5))
                        .block();

                // JSON 파싱
                @SuppressWarnings("unchecked")
                Map<String, Object> parsed = objectMapper.readValue(response, Map.class);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) parsed.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    String text = (String) parts.get(0).get("text");

                    // JSON 추출 (```json ``` 제거)
                    String jsonContent = text.replaceAll("```json\\s*", "").replaceAll("```", "").trim();

                    return objectMapper.readValue(jsonContent, Map.class);
                }
            } catch (Exception e) {
                System.err.println("Model " + model + " failed: " + e.getMessage());
                if (i == googleModels.size() - 1) {
                    System.err.println("All AI Models failed for empty result.");
                    return null;
                }
            }
        }
        return null;
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
                "Verify strict JSON format. NO MARKDOWN.\n" +
                        "Task: Analyze search query and generate relevant tags/topics.\n" +
                        "- `suggestedTags`: Extract directly from query or highly relevant synonyms from provided `Tags` list.\n"
                        +
                        "- `relatedTopics`: Broader concepts or related technologies that are NOT in `suggestedTags`.\n"
                        +
                        "- `semanticWeightMap`: Key-value pairs of related terms and their relevance score (-1.0 to 1.0).\n\n"
                        +
                        "Ex: '리액트' -> {\"intent\":\"LEARNING\",\"translatedQuery\":\"React\",\"synonyms\":[\"ReactJS\"],\"suggestedTags\":[\"React\",\"JavaScript\"],\"relatedTopics\":[\"Frontend\",\"SPA\",\"Hooks\",\"Redux\"],\"semanticWeightMap\":{\"React\":1.0,\"JavaScript\":0.8,\"Vue\":-0.5},\"confidence\":1.0}\n"
                        +
                        "Ex: '자바' -> {\"intent\":\"LEARNING\",\"translatedQuery\":\"Java\",\"synonyms\":[\"JDK\"],\"suggestedTags\":[\"Java\",\"Spring\"],\"relatedTopics\":[\"Backend\",\"JVM\",\"OOP\",\"Kotlin\"],\"semanticWeightMap\":{\"Java\":1.0,\"Spring\":0.8,\"JavaScript\":-0.2},\"confidence\":1.0}\n\n"
                        +
                        "Query: '%s'\nAvailable DB Tags: %s\n" +
                        "REQUIRED: Generate 3-5 `relatedTopics` even if not in DB Tags.",
                query, existingTags);

        // [Dynamic Token Calculation] Google Gemini Limit (30k+ but let's be safe)
        int estimatedInputTokens = prompt.length() / 3;
        System.out.println("[Token Calc] Input: ~" + estimatedInputTokens + " tokens");

        // [Failover Strategy] Iterate through available models
        Map<String, Object> finalResponse = null;

        for (String model : googleModels) {
            System.out.println("Trying LLM Model: " + model);
            try {
                // Google Gemini Request Body Construction
                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of(
                                "parts", List.of(Map.of("text", prompt)))),
                        "generationConfig", Map.of(
                                "response_mime_type", "application/json",
                                "temperature", 0.0));

                Map<String, Object> response = googleWebClient.post()
                        .uri(uriBuilder -> uriBuilder
                                .path("/v1beta/models/" + model + ":generateContent")
                                .queryParam("key", googleApiKey)
                                .build())
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .map(res -> {
                            try {
                                // Google Gemini Response Parsing
                                List<Map<String, Object>> candidates = (List<Map<String, Object>>) res
                                        .get("candidates");
                                if (candidates != null && !candidates.isEmpty()) {
                                    Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0)
                                            .get("content");
                                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap
                                            .get("parts");
                                    String text = (String) parts.get(0).get("text");
                                    System.out.println("RAW AI Content (" + model + "): " + text);
                                    return objectMapper.readValue(text, Map.class);
                                }
                                return Collections.emptyMap();
                            } catch (Exception e) {
                                throw new RuntimeException("JSON Parse Error", e);
                            }
                        })
                        .timeout(java.time.Duration.ofMillis(5000))
                        .block();

                // Success! Capture response and break loop
                if (response != null && !response.isEmpty()) {
                    finalResponse = response;
                    break;
                }

            } catch (Exception e) {
                System.err.println("Model " + model + " failed: " + e.getMessage());
                // Continue to next model
            }
        }

        if (finalResponse == null || finalResponse.isEmpty()) {
            System.out.println("All AI Models failed. Returning basic search results.");
            return Map.of("_error", "all_models_failed");
        }

        // Assign to 'response' for backward compatibility with downstream logic
        Map<String, Object> response = finalResponse;

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
    }

    /**
     * Tag 검색 등 간단한 메타데이터 저장 (AI 분석 없이)
     */
    private void saveSimpleMetadata(String query, String intent) {
        try {
            Optional<SearchMetadata> existing = searchMetadataRepository.findBySearchQuery(query);
            if (existing.isEmpty()) {
                SearchMetadata meta = SearchMetadata.builder()
                        .searchQuery(query)
                        .intent(intent)
                        .build();
                searchMetadataRepository.save(meta);
                System.out.println("[Metadata] Saved simple metadata for: " + query);
            }
        } catch (Exception e) {
            System.err.println("[Metadata] Save failed: " + e.getMessage());
        }
    }

    /**
     * 빈 결과 메타데이터 저장 (AI 추천 태그 포함)
     */
    private void saveEmptyResultMetadata(String query, List<String> suggestedTags, List<String> relatedTopics) {
        try {
            Optional<SearchMetadata> existing = searchMetadataRepository.findBySearchQuery(query);
            SearchMetadata meta;

            if (existing.isPresent()) {
                meta = existing.get();
                meta.setIntent("EMPTY_RESULT");
                meta.setSuggestedTags(String.join(",", suggestedTags));
                meta.setRelatedTopics(String.join(",", relatedTopics));
            } else {
                meta = SearchMetadata.builder()
                        .searchQuery(query)
                        .intent("EMPTY_RESULT")
                        .suggestedTags(String.join(",", suggestedTags))
                        .relatedTopics(String.join(",", relatedTopics))
                        .build();
            }

            searchMetadataRepository.save(meta);
            System.out.println("[Metadata] Saved empty result metadata for: " + query);
        } catch (Exception e) {
            System.err.println("[Metadata] Save failed: " + e.getMessage());
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

        // 2. 작성자 닉네임 조회
        List<Long> userIds = posts.stream().map(Post::getUserId).distinct().toList();
        Map<Long, String> authorNameMap = userRepository.findIdAndNickNameByIdIn(userIds).stream()
                .collect(Collectors.toMap(
                        com.skull.logbook.repository.UserRepository.UserIdNickNameProjection::getId,
                        com.skull.logbook.repository.UserRepository.UserIdNickNameProjection::getNickName,
                        (a, b) -> a));

        // 3. 좋아요 수 조회
        Map<Long, Long> likeCountMap = Collections.emptyMap();
        if (!postIds.isEmpty()) {
            List<Object[]> likeCountData = postLikeRepository.countLikesByPostIds(postIds);
            likeCountMap = likeCountData.stream()
                    .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1], (a, b) -> a));
        }

        Map<Long, Long> finalLikeCountMap = likeCountMap;
        return posts.stream()
                .map(post -> new PostResponseDto(
                        post.getId(),
                        String.valueOf(post.getUserId()),
                        authorNameMap.getOrDefault(post.getUserId(), ""),
                        post.getTitle(),
                        post.getContent(),
                        post.getCreatedAt().toString(),
                        post.getUpdatedAt().toString(),
                        tagsMap.getOrDefault(post.getId(), new ArrayList<>()),
                        Boolean.TRUE.equals(post.getIsActive()),
                        finalLikeCountMap.getOrDefault(post.getId(), 0L),
                        false))
                .collect(Collectors.toList());
    }
}
