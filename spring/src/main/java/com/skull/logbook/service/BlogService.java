package com.skull.logbook.service;

import com.skull.logbook.dto.BlogLayoutDto;
import com.skull.logbook.entity.Blog;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.BlogRepository;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.security.PrincipalDetails;
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
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final String DEFAULT_LAYOUT = """
            {
              "layout": [],
              "elements": []
            }
            """;

    public BlogLayoutDto getBlogData(String loginId) {
        Blog blog = blogRepository.findByUserLoginIdWithUser(loginId)
                .orElseThrow(() -> new EntityNotFoundException("해당 블로그가 존재하지 않습니다."));

        try {
            JsonNode root = objectMapper.readTree(blog.getLayout());

            JsonNode elementsNode = root.get("elements");
            if (elementsNode != null && elementsNode.isArray()) {
                for (JsonNode el : elementsNode) {
                    if (el.isObject() && !el.has("meta")) {
                        ((tools.jackson.databind.node.ObjectNode) el)
                                .set("meta", objectMapper.createObjectNode());
                    }
                }
            }

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

            String colorTheme = root.path("colorTheme").asText("#9ee7e7");

            return new BlogLayoutDto(
                    blog.getId(),
                    blog.getUser().getLoginId(),
                    layout,
                    elements,
                    colorTheme,
                    blog.getCreatedAt(),
                    blog.getUpdatedAt(),
                    blog.getDeletedAt()
            );
        } catch (Exception e) {
            throw new RuntimeException("블로그 JSON 파싱 실패", e);
        }
    }

    public Blog updateBlogLayout(
            Long userId,
            String layout,
            PrincipalDetails principal
    ) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new EntityNotFoundException("해당 유저가 존재하지 않습니다."));

        Blog blog = blogRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Blog newBlog = Blog.builder()
                            .user(user)
                            .layout(DEFAULT_LAYOUT)
                            .build();
                    return blogRepository.save(newBlog);
                });

        // 기존 블로그든 새 블로그든 layout 업데이트
        blog.updateLayout(layout);

        return blog;
    }
}
