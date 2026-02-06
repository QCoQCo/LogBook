package com.skull.logbook.service;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.dto.SearchResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.repository.PostRepository;
import com.skull.logbook.repository.PostTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SmartSearchService {

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    // private final PostService postService; // Removed unused field

    public SearchResponseDto search(String query) {
        Pageable pageable = PageRequest.of(0, 10);

        // 1. [DB Search] 제목/내용 검색 (Primary)
        List<Post> dbResults = postRepository.findByTitleContainingOrContentContainingOrderByCreatedAtDesc(query, query,
                pageable);

        // 검색 결과가 충분하면(예: 3개 이상) 바로 반환
        if (dbResults.size() >= 3) {
            return new SearchResponseDto(
                    toPostResponseDtos(dbResults),
                    Collections.emptyList(),
                    "DB");
        }

        // 2. [AI Fallback] 결과가 부족하면 AI(Mock)에게 연관 태그 추천 요청
        List<String> aiSuggestedTags = getAiSuggestedTags(query);

        // 3. [Secondary Search] 추천된 태그로 게시글 추가 검색
        Set<Post> hybridResults = new HashSet<>(dbResults);
        for (String tag : aiSuggestedTags) {
            List<Long> postIds = postTagRepository.findPostIdsByTagName(tag);
            List<Post> tagPosts = postRepository.findAllByIdIn(postIds);
            hybridResults.addAll(tagPosts);
        }

        // 4. 결과 정렬 (최신순)
        List<Post> finalPosts = hybridResults.stream()
                .sorted(Comparator.comparing(Post::getCreatedAt).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return new SearchResponseDto(
                toPostResponseDtos(finalPosts),
                aiSuggestedTags,
                "AI_HYBRID");
    }

    // AI 모의 로직 (Rule-based Mock)
    private List<String> getAiSuggestedTags(String query) {
        // 실제로는 여기서 OpenAI API 등을 호출해야 함.
        // 현재는 키워드 기반 매핑으로 시뮬레이션
        Map<String, List<String>> keywordMap = new HashMap<>();
        keywordMap.put("자바", Arrays.asList("Java", "Spring", "Backend"));
        keywordMap.put("프론트", Arrays.asList("React", "JavaScript", "HTML/CSS"));
        keywordMap.put("초보", Arrays.asList("Basic", "Tutorial", "회고"));
        keywordMap.put("에러", Arrays.asList("Troubleshooting", "Bug", "Debug"));
        keywordMap.put("배포", Arrays.asList("DevOps", "Docker", "AWS"));

        for (String key : keywordMap.keySet()) {
            if (query.contains(key)) {
                return keywordMap.get(key);
            }
        }

        // 매칭되는게 없으면 빈 리스트보다, 랜덤하게 인기 태그라도 던져줄 수 있음(선택사항)
        return Collections.emptyList();
    }

    private List<PostResponseDto> toPostResponseDtos(List<Post> posts) {
        if (posts.isEmpty())
            return Collections.emptyList();

        // PostService의 로직을 재사용하고 싶지만, 순환 참조 이슈나 메소드 접근성을 고려해 여기서 직접 변환
        // (단, getAllPosts 로직과 동일하게 태그를 매핑해야 함. 이를 위해 PostService.getAllPosts 구조를 리팩토링하여
        // 가져다 쓰는게 좋지만,
        // 일단 여기서는 간략히 구현하고 추후 리팩토링)

        // 1. ID 목록 추출
        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());

        // 2. 태그 조회
        List<Object[]> tagData = postTagRepository.findTagsByPostIds(postIds);
        Map<Long, List<String>> tagsMap = tagData.stream()
                .collect(Collectors.groupingBy(
                        data -> (Long) data[0],
                        Collectors.mapping(data -> (String) data[1], Collectors.toList())));

        return posts.stream()
                .map(post -> new PostResponseDto(
                        post.getId(),
                        String.valueOf(post.getUserId()),
                        post.getTitle(),
                        post.getContent(),
                        post.getCreatedAt().toString(),
                        post.getUpdatedAt().toString(),
                        tagsMap.getOrDefault(post.getId(), new ArrayList<>())))
                .collect(Collectors.toList());
    }
}
