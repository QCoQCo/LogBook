package com.skull.logbook.service;

import com.skull.logbook.dto.LinkPreviewResponseDto;
import lombok.RequiredArgsConstructor;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.UnknownHostException;

@Service
@RequiredArgsConstructor
public class LinkPreviewService {

    // 리다이렉트는 직접 따라가며 매 단계마다 주소를 다시 검사 (외부 → 내부 리다이렉트 우회 방지)
    private static final int MAX_REDIRECTS = 5;
    private static final int MAX_BODY_SIZE = 1024 * 1024; // 1MB

    public LinkPreviewResponseDto parse(String url) {
        try {
            Document doc = fetch(normalizeUrl(url));

            String title = extractTitle(doc);
            String thumbnail = extractThumbnail(doc);

            return LinkPreviewResponseDto.of(title, thumbnail);

        } catch (Exception e) {
            // 실패는 정상 흐름
            return LinkPreviewResponseDto.of(null, null);
        }
    }

    private Document fetch(String startUrl) throws IOException {
        URL current = URI.create(startUrl).toURL();

        for (int i = 0; i <= MAX_REDIRECTS; i++) {
            requirePublicUrl(current);

            Connection.Response response = Jsoup.connect(current.toString())
                    .userAgent("Mozilla/5.0 (compatible; LogbookBot/1.0)")
                    .timeout(3000)
                    .followRedirects(false)
                    .maxBodySize(MAX_BODY_SIZE)
                    .ignoreHttpErrors(true)
                    .execute();

            int status = response.statusCode();
            if (status >= 300 && status < 400 && response.hasHeader("Location")) {
                try {
                    current = current.toURI().resolve(response.header("Location")).toURL();
                } catch (URISyntaxException | IllegalArgumentException e) {
                    throw new IOException("잘못된 리다이렉트 주소입니다.", e);
                }
                continue;
            }
            if (status >= 400) {
                throw new IOException("링크 응답 오류: " + status);
            }
            return response.parse();
        }
        throw new IOException("리다이렉트가 너무 많습니다.");
    }

    /**
     * SSRF 방지: http/https 기본 포트만 허용하고, 내부망·루프백·클라우드 메타데이터 주소로 해석되는 호스트는 차단.
     * (DNS가 검사 직후 바뀌는 리바인딩 공격까지 막지는 못함)
     */
    private void requirePublicUrl(URL url) throws IOException {
        String protocol = url.getProtocol();
        if (!"http".equals(protocol) && !"https".equals(protocol)) {
            throw new IOException("허용되지 않는 프로토콜입니다.");
        }
        int port = url.getPort();
        if (port != -1 && port != 80 && port != 443) {
            throw new IOException("허용되지 않는 포트입니다.");
        }
        String host = url.getHost();
        if (host == null || host.isBlank()) {
            throw new IOException("호스트가 없습니다.");
        }
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new IOException("호스트를 찾을 수 없습니다.", e);
        }
        for (InetAddress address : addresses) {
            if (isInternalAddress(address)) {
                throw new IOException("내부 주소로의 요청은 허용되지 않습니다.");
            }
        }
    }

    private boolean isInternalAddress(InetAddress address) {
        if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
                || address.isSiteLocalAddress() || address.isMulticastAddress()) {
            return true;
        }
        byte[] b = address.getAddress();
        if (address instanceof Inet4Address) {
            int first = b[0] & 0xff;
            int second = b[1] & 0xff;
            return first == 0 // 0.0.0.0/8
                    || (first == 100 && second >= 64 && second <= 127); // 100.64.0.0/10 (CGNAT)
        }
        if (address instanceof Inet6Address) {
            return (b[0] & 0xfe) == 0xfc; // fc00::/7 (Unique Local)
        }
        return false;
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
