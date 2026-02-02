package com.skull.logbook.service;

import com.skull.logbook.dto.BlogLayoutDto;
import com.skull.logbook.repository.BlogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class BlogService {
    private final BlogRepository blogRepository;

    public BlogLayoutDto getBlogData(Long userId) {

    }

}
