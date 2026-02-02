package com.skull.logbook.service;

import com.skull.logbook.dto.BlogLayoutDto;
import com.skull.logbook.entity.Blog;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.BlogRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class BlogService {
    private final BlogRepository blogRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public BlogLayoutDto getBlogData(String loginId) {
        User user = userService.getUserByLoginId(loginId);

        Blog blog = blogRepository.findByUserId(user.getId())
                .orElseThrow(() -> new EntityNotFoundException("해당 블로그가 존재하지 않습니다."));

        try {
            JsonNode root = objectMapper.readTree(blog.getLayout());

            List<Map<String, Object>> layout =
                    objectMapper.convertValue(
                            root.get("layout"),
                            new TypeReference<List<Map<String, Object>>>() {}
                    );

            List<Map<String, Object>> elements =
                    objectMapper.convertValue(
                            root.get("elements"),
                            new TypeReference<List<Map<String, Object>>>() {}
                    );

            return new BlogLayoutDto(
                    blog.getId(),
                    blog.getUser().getLoginId(),
                    layout,
                    elements,
                    blog.getCreatedAt(),
                    blog.getUpdatedAt(),
                    blog.getDeletedAt()
            );
        } catch (Exception e) {
            throw new RuntimeException("블로그 JSON 파싱 실패", e);
        }
    }
}
