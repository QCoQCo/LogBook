package com.skull.logbook.service;

import com.skull.logbook.entity.ChatRoom;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.ChatRoomRepository;
import com.skull.logbook.repository.PostRepository;
import com.skull.logbook.repository.PostTagRepository;
import com.skull.logbook.repository.ReportRepository;
import com.skull.logbook.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ReportRepository reportRepository;

    public Map<String, Object> getStats() {
        long totalPosts = postRepository.countByDeletedAtIsNull();
        long userCount = userRepository.count();
        long reportCount = reportRepository.count();

        List<Object[]> tagCounts = postTagRepository.countPostsByTagName();
        List<Map<String, Object>> postsByTag = tagCounts.stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("tagName", row[0]);
                    m.put("count", ((Number) row[1]).longValue());
                    return m;
                })
                .collect(Collectors.toList());

        List<Object[]> userCounts = postRepository.countPostsByUserId();
        Map<Long, User> userMap = new HashMap<>();
        if (!userCounts.isEmpty()) {
            List<Long> userIds = userCounts.stream()
                    .map(row -> (Long) row[0])
                    .collect(Collectors.toList());
            userRepository.findAllById(userIds).forEach(u -> userMap.put(u.getId(), u));
        }
        List<Map<String, Object>> postsByUser = userCounts.stream()
                .map(row -> {
                    Long userId = (Long) row[0];
                    long count = ((Number) row[1]).longValue();
                    User user = userMap.get(userId);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("userId", userId);
                    m.put("userName", user != null ? user.getNickName() : "ID:" + userId);
                    m.put("count", count);
                    return m;
                })
                .collect(Collectors.toList());

        List<ChatRoom> chatRooms = chatRoomRepository.findAllByOrderByIdAsc();
        List<Map<String, Object>> chatRoomsStats = chatRooms.stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", r.getName());
                    m.put("currentUsers", r.getCurrentUsers() != null ? r.getCurrentUsers() : 0);
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalPosts", totalPosts);
        result.put("userCount", userCount);
        result.put("reportCount", reportCount);
        result.put("chatroomCount", chatRooms.size());
        result.put("postsByTag", postsByTag);
        result.put("postsByUser", postsByUser);
        result.put("chatRooms", chatRoomsStats);
        return result;
    }
}
