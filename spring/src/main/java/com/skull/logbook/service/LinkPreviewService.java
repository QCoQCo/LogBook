package com.skull.logbook.service;

import com.skull.logbook.dto.LinkPreviewResponseDto;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LinkPreviewService {

    public LinkPreviewResponseDto parse(String url) {
        try {
            Document doc = Jsoup.connect(normalizeUrl(url))
                    .userAgent("Mozilla/5.0 (compatible; LogbookBot/1.0)")
                    .timeout(3000)
                    .followRedirects(true)
                    .get();

            String title = extractTitle(doc);
            String thumbnail = extractThumbnail(doc);

            return LinkPreviewResponseDto.of(title, thumbnail);

        } catch (Exception e) {
            // 실패는 정상 흐름
            return LinkPreviewResponseDto.of(null, null);
        }
    }

    private String extractTitle(Document doc) {
        String ogTitle = getMeta(doc, "property", "og:title");
        if (ogTitle != null)
            return ogTitle;

        String twitterTitle = getMeta(doc, "name", "twitter:title");
        if (twitterTitle != null)
            return twitterTitle;

        return doc.title().isBlank() ? null : doc.title();
    }

    private String extractThumbnail(Document doc) {
        String ogImage = getMeta(doc, "property", "og:image");
        if (ogImage != null)
            return ogImage;

        return getMeta(doc, "name", "twitter:image");
    }

    private String getMeta(Document doc, String key, String value) {
        Element meta = doc.selectFirst(
                String.format("meta[%s=%s]", key, value));
        return meta != null ? meta.attr("content") : null;
    }

    private String normalizeUrl(String url) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        return "https://" + url;
    }
}
