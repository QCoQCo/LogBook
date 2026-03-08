# ☠️ LogBook 🏴‍☠️

### 海賊の航海日誌 — 自由なソーシャルブログプラットフォーム / 해적의 항해일지 - 자유로운 소셜 블로그 플랫폼

<div align="center">

---

## 🌐 언어 선택 / 言語選択

<details>
<summary><strong>🇰🇷 한국어</strong> · <strong>🇯🇵 日本語</strong> — 클릭하여 선택 / クリックして選択</summary>

|                                    |                                   |
| ---------------------------------- | --------------------------------- |
| **[🇰🇷 한국어로 읽기](#readme-ko)** | **[🇯🇵 日本語で読む](#readme-ja)** |

</details>

---

![LogBook Banner](./logBook/public/img/logBook_logo.png)

**🌊 海のように自由に、宝物のように大切なあなたの物語を記録しましょう ⚓**  
**🌊 바다처럼 자유롭고, 보물처럼 소중한 당신의 이야기를 기록하세요 ⚓**

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Spring](https://img.shields.io/badge/Spring-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)](https://sass-lang.com/)

[🎬 데모 보기 / デモ](https://your-demo-link.com) · [📖 문서 / Wiki](https://github.com/QCoQCo/LogBook/wiki) · [🐛 버그 신고 / バグ報告](https://github.com/QCoQCo/LogBook/issues) · [✨ 기능 요청 / 機能要望](https://github.com/QCoQCo/LogBook/issues)

</div>

---

<span id="readme-ko"></span>

## 🇰🇷 한국어

### 🗺️ 목차

- [⚓ 프로젝트 소개](#ko-proj-intro)
- [📁 프로젝트 구조](#ko-proj-structure)
- [📋 요구사항 정의서](#ko-requirements)
- [🏴‍☠️ 주요 기능](#ko-features)
- [⚡ 기술 스택](#ko-tech-stack)
- [🏗️ 시스템 아키텍처](#ko-architecture)
- [📡 API 명세서](#ko-api)
- [🗄️ ERD 및 테이블 정의서](#ko-erd)
- [🔄 핵심 로직 시퀀스 다이어그램](#ko-sequence)
- [🚀 시작하기](#ko-getting-started)
- [🔧 설정 가이드](#ko-config)
- [🎯 사용법](#ko-usage)
- [🤝 기여하기](#ko-contribute)
- [📄 라이센스](#ko-license)

---

<span id="ko-proj-intro"></span>

### ⚓ 프로젝트 소개

**LogBook**은 해적의 항해일지에서 영감을 받아 만들어진 혁신적인 소셜 블로그 플랫폼입니다.  
자유로운 바다처럼 제약 없는 블로그 디자인과 실시간 소통이 가능한 완전한 소셜 플랫폼을 제공합니다.

#### 🌟 왜 LogBook인가?

- **🎨 완전한 자유도**: React Grid Layout 드래그 앤 드롭으로 블로그를 원하는 대로 디자인
- **💬 실시간 소통**: Firebase 기반 실시간 채팅 및 Spring 백엔드 API
- **🎵 감성적인 경험**: YouTube 음악과 함께하는 블로그 작성
- **📝 직관적인 에디터**: Velog 스타일 마크다운 편집기, 실시간 미리보기
- **👤 소셜 로그인**: Google / Kakao / Naver OAuth2 지원

---

<span id="ko-proj-structure"></span>

### 📁 프로젝트 구조

```
PJ02/
├── logBook/                 # React 프론트엔드 (Vite + React)
│   ├── public/
│   │   └── img/
│   └── src/
│       ├── components/      # 페이지 및 UI 컴포넌트
│       ├── context/         # React Context (인증, 포스트 등)
│       ├── hooks/           # 커스텀 훅
│       ├── pages/
│       └── ...
├── spring/                  # Spring Boot 백엔드
│   └── src/main/java/com/skull/logbook/
│       ├── controller/      # REST API 컨트롤러
│       ├── service/         # 비즈니스 로직
│       ├── entity/          # JPA 엔티티
│       ├── repository/      # 데이터 접근 계층
│       └── config/          # 보안, WebSocket 등 설정
├── .env                     # 환경 변수 (Firebase, DB, OAuth, API 키 등)
└── README.md
```

---

<span id="ko-requirements"></span>

### 📋 요구사항 정의서

| 기능 ID | 기능 상세 설명                                                         | 중요도 |
| ------- | ---------------------------------------------------------------------- | ------ |
| REQ-01  | 이메일 인증 기반 로컬 회원가입 (코드 발송 → 검증 → 가입)               | 상     |
| REQ-02  | Google / Kakao / Naver OAuth2 소셜 로그인                              | 상     |
| REQ-03  | JWT Access Token (단기) + Refresh Token (HttpOnly 쿠키, 7일) 이중 발급 | 상     |
| REQ-04  | 토큰 자동 갱신 (`/api/auth/refresh`)                                   | 상     |
| REQ-05  | 비밀번호 변경 / 아이디·비밀번호 찾기                                   | 중     |
| REQ-06  | 사용자 프로필 수정 (닉네임, 소개글, 프로필 사진 SFTP 업로드)           | 중     |
| REQ-07  | 팔로우 / 언팔로우 및 팔로우 상태 조회                                  | 중     |
| REQ-08  | 블록 에디터(BlockNote) 기반 포스트 작성·수정·소프트 삭제               | 상     |
| REQ-09  | 포스트 목록 페이지네이션 조회 (필터·태그 검색 포함)                    | 상     |
| REQ-10  | Gemini AI 기반 스마트 검색 (의도 분석 + 태그 매칭)                     | 상     |
| REQ-11  | 포스트 좋아요 토글 (중복 방지)                                         | 중     |
| REQ-12  | 댓글 작성·수정·소프트 삭제 (대댓글 지원)                               | 중     |
| REQ-13  | YouTube URL 기반 플레이리스트 임포트                                   | 상     |
| REQ-14  | 플레이리스트 CRUD 및 트랙 순서 일괄 변경                               | 중     |
| REQ-15  | Firebase 기반 실시간 채팅 (공개·비공개방)                              | 상     |
| REQ-16  | 채팅방 생성·삭제·비밀번호 검증                                         | 중     |
| REQ-17  | 알림(Notification) 생성·조회·읽음 처리                                 | 중     |
| REQ-18  | 링크 미리보기 메타데이터 파싱 (Jsoup)                                  | 하     |
| REQ-19  | 어뷰징 포스트 신고 접수                                                | 하     |
| REQ-20  | 관리자(ADMIN) 사용자 목록·통계·포스트 관리                             | 상     |
| REQ-21  | 다크모드 토글 (로컬스토리지 영속)                                      | 하     |
| REQ-22  | Google Maps API 기반 지도 위치 표시                                    | 하     |

---

<span id="ko-features"></span>

### 🏴‍☠️ 주요 기능

| 영역       | 기능                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| **블로그** | React Grid Layout 드래그 앤 드롭, 이미지/텍스트/링크/지도 컴포넌트, 실시간 미리보기 |
| **채팅**   | Firebase 기반 다중 채팅방, 실시간 메시지, 참여자 관리                               |
| **음악**   | YouTube API 연동 플레이리스트, 팝업 플레이어                                        |
| **글쓰기** | Velog 스타일 마크다운 에디터, 코드 하이라이팅, 이미지 업로드                        |
| **인증**   | 이메일 로그인, Google / Kakao / Naver OAuth2                                        |

#### 📝 블로그 에디터

- **실시간 미리보기**로 즉시 결과 확인
- **반응형 디자인** 자동 적용
- **드래그 앤 드롭** 그리드 레이아웃

#### 💬 실시간 채팅 시스템

- **다중 채팅방** 생성 및 관리
- **실시간 메시지** 송수신
- **사용자 상태 관리** (온라인/오프라인)
- **메시지 삭제** 및 편집 기능

#### 🎵 YouTube 음악 플레이리스트

- **YouTube API** 연동으로 무제한 음악 검색
- **팝업 플레이어**로 블로그 작성 중에도 음악 감상
- **개인 플레이리스트** 생성 및 관리

#### 👤 소셜 프로필 시스템

- **개인 프로필** 커스터마이징
- **다른 사용자 프로필** 방문
- **블로그, 채팅, 게시글** 통합 관리

---

<span id="ko-tech-stack"></span>

### ⚡ 기술 스택

#### Frontend

| 기술              | 버전    | 용도                  |
| ----------------- | ------- | --------------------- |
| React             | ^19.1.1 | UI 라이브러리         |
| Vite              | ^7.1.2  | 빌드 도구             |
| React Router      | ^7.8.1  | SPA 라우팅            |
| SCSS              | -       | 스타일링              |
| React Grid Layout | ^1.5.2  | 드래그 앤 드롭 그리드 |
| React Markdown    | ^10.1.0 | 마크다운 렌더링       |
| Swiper            | ^12.1.2 | 슬라이더/캐러셀       |
| Axios             | ^1.11.0 | HTTP 클라이언트       |
| Firebase          | ^12.1.0 | 인증, Firestore       |

#### Backend

| 기술             | 버전   | 용도              |
| ---------------- | ------ | ----------------- |
| Spring Boot      | ^4.0.1 | 백엔드 프레임워크 |
| Spring Security  | -      | 인증/인가         |
| Spring WebSocket | -      | 실시간 통신       |
| JPA / MySQL      | -      | 데이터베이스      |
| JWT              | -      | 토큰 기반 인증    |
| OAuth2           | -      | 소셜 로그인       |

#### 기타

- **SMTP**: 이메일 발송
- **YouTube Data API**: 음악 검색
- **Google Maps API**: 지도 컴포넌트

---

<span id="ko-architecture"></span>

### 🏗️ 시스템 아키텍처

```
[클라이언트 (브라우저)]
        │
        │ HTTPS (포트 443 → 프록시)
        ▼
[Nginx / Reverse Proxy]
  ├── /                  →  React SPA (정적 빌드 dist/)
  ├── /api/*             →  Spring Boot (http://backend:8080)
  └── /oauth2/*          →  Spring OAuth2 리다이렉트 처리
        │
        ├─── [Spring Boot 백엔드] :8080 (context-path: /api)
        │         ├── Spring Security (JWT 필터 체인)
        │         ├── OAuth2 Client (Google/Kakao/Naver)
        │         ├── JPA / Hibernate
        │         │         └── [MySQL 8 — Aiven Cloud] :16606
        │         ├── SFTP Client (JSch) → [NAS 파일 서버] :2222
        │         ├── Gmail SMTP → [이메일 인증 발송]
        │         ├── Gemini API (Google AI) → [스마트 검색]
        │         ├── YouTube Data API v3 → [재생목록 임포트]
        │         └── WebSocket (STOMP) → [알림 실시간 Push]
        │
        └─── [Firebase Realtime DB] (채팅 메시지 영속·실시간 동기화)

[흐름 요약]
사용자 요청 → Nginx → React SPA 또는 /api 라우팅
/api 요청   → Spring Boot → JWT 검증 → 비즈니스 로직 → MySQL 읽기/쓰기
파일 업로드 → Spring Boot → SFTP → NAS 서버 저장
채팅 메시지 → Firebase SDK (클라이언트 직접 쓰기/읽기)
스마트 검색 → Spring Boot → Gemini API 호출 → 결과 태그 매핑
```

---

<span id="ko-api"></span>

### 📡 API 명세서

<details>
<summary>클릭하여 펼치기</summary>

#### 메뉴 구조도

```
LogBook
├── 홈 (/)
├── 포스트 (/posts, /posts/:id, /write, /edit/:id)
├── 블로그 (/:loginId/blog)
├── 채팅 (/chat, /chat/:roomId)
├── 스마트 검색 (/search)
├── 알림 (/notifications)
├── 관리자 (/admin)  [ADMIN 권한 전용]
└── 계정 (/login, /signup, /profile)
```

#### 인증 (`/api/auth`)

| URL 경로                    | Method | 파라미터                                             | 반환 형식                      |
| --------------------------- | ------ | ---------------------------------------------------- | ------------------------------ |
| `/api/auth/email/send`      | POST   | `{ email }`                                          | `{ message }`                  |
| `/api/auth/email/verify`    | POST   | `{ email, code }`                                    | `{ verified, token }`          |
| `/api/auth/signup`          | POST   | `SignupRequestDto`                                   | `{ message, userId }`          |
| `/api/auth/login`           | POST   | `{ loginId, password }`                              | `{ token, user }` + Set-Cookie |
| `/api/auth/logout`          | POST   | Cookie: `refreshToken`                               | `{ message }`                  |
| `/api/auth/refresh`         | POST   | Cookie: `refreshToken`                               | `{ token }`                    |
| `/api/auth/change-password` | POST   | `{ userId, oldPassword, newPassword }`               | `{ message }`                  |
| `/api/auth/find-id`         | POST   | `{ email }`                                          | `{ loginId }`                  |
| `/api/auth/reset-password`  | POST   | `{ verificationToken, email, loginId, newPassword }` | `{ message }`                  |

#### 포스트 (`/api/posts`)

| URL 경로                       | Method | 파라미터                  | 반환 형식                  |
| ------------------------------ | ------ | ------------------------- | -------------------------- |
| `/api/posts`                   | GET    | `page, size, filter`      | `List<PostResponseDto>`    |
| `/api/posts`                   | POST   | `PostRequestDto` (인증)   | `Long` (postId)            |
| `/api/posts/{postId}`          | GET    | —                         | `PostResponseDto`          |
| `/api/posts/{postId}`          | PUT    | `PostRequestDto` (소유자) | `204`                      |
| `/api/posts`                   | DELETE | `{ postId }` (소유자)     | `204`                      |
| `/api/posts/{postId}/like`     | POST   | 인증                      | `{ likeCount, isLiked }`   |
| `/api/posts/{postId}/like`     | DELETE | 인증                      | `{ likeCount, isLiked }`   |
| `/api/posts/lists/{userId}`    | GET    | `Pageable`                | `Page<UserPostListDto>`    |
| `/api/posts/{postId}/comments` | GET    | —                         | `List<CommentResponseDto>` |

#### 사용자 (`/api/users`)

| URL 경로                     | Method | 파라미터                               | 반환 형식                    |
| ---------------------------- | ------ | -------------------------------------- | ---------------------------- |
| `/api/users/{loginId}`       | GET    | —                                      | `UserResponseDto`            |
| `/api/users/{userId}`        | PUT    | `file, introduction, nickName, layout` | `{ profilePhoto, nickName }` |
| `/api/users/{userId}/follow` | POST   | 인증                                   | `{ following }`              |
| `/api/users/{userId}/follow` | DELETE | 인증                                   | `{ following }`              |

#### 플레이리스트 (`/api/playlists`)

| URL 경로                                  | Method | 파라미터                        | 반환 형식                   |
| ----------------------------------------- | ------ | ------------------------------- | --------------------------- |
| `/api/playlists`                          | POST   | `PlaylistRequestDto` (인증)     | `PlaylistResponseDto`       |
| `/api/playlists`                          | GET    | `userId`                        | `List<PlaylistResponseDto>` |
| `/api/playlists/{playlistId}`             | GET    | —                               | `PlaylistDetailDto`         |
| `/api/playlists/{playlistId}/items`       | POST   | `PlaylistItemRequestDto` (인증) | `PlaylistItemResponseDto`   |
| `/api/playlists/{playlistId}/items/batch` | PATCH  | `List<PlaylistItemRequestDto>`  | `{ message }`               |
| `/api/playlists/import-yt`                | POST   | `{ playlistUrl }` (인증)        | `List<PlaylistItemDto>`     |

#### 채팅 / 알림 / 검색

| URL 경로                          | Method | 설명                     | 반환 형식                       |
| --------------------------------- | ------ | ------------------------ | ------------------------------- |
| `/api/chat/chat-rooms`            | GET    | 채팅방 목록              | `{ chatRooms }`                 |
| `/api/chat/chat-rooms`            | POST   | 채팅방 생성 (인증)       | `ChatRoomDto`                   |
| `/api/chat/chat-rooms/{id}`       | DELETE | 채팅방 삭제 (인증)       | `{ message }`                   |
| `/api/notifications`              | GET    | 내 알림 목록 (인증)      | `Page<NotificationResponseDto>` |
| `/api/notifications/unread-count` | GET    | 읽지 않은 알림 수        | `Long`                          |
| `/api/notifications/{id}/read`    | PATCH  | 단건 읽음 처리           | `204`                           |
| `/api/notifications/read-all`     | PATCH  | 전체 읽음 처리           | `204`                           |
| `/api/search`                     | GET    | `q` 파라미터 스마트 검색 | `SmartSearchResponseDto`        |
| `/api/files/upload`               | POST   | SFTP 이미지 업로드       | `{ url }`                       |

---

<span id="ko-erd"></span>

### 🗄️ ERD 및 테이블 정의서

#### ERD 관계 요약

```
user ──1:1── blog
user ──1:N── post
user ──1:N── comment
user ──1:N── playlist
user ──M:N── post_like
user ──M:N── user_follow
post ──1:N── comment
post ──1:N── post_tag
post ──1:N── search_metadata
playlist ──1:N── playlist_item
user ──1:N── notification
user ──1:N── auth_session (Refresh Token)
```

#### `user` 테이블

| 물리명        | 논리명                                 | 타입         | PK/FK/기타         |
| ------------- | -------------------------------------- | ------------ | ------------------ |
| id            | 사용자 PK                              | BIGINT       | PK, AUTO_INCREMENT |
| login_id      | 로그인 아이디                          | VARCHAR(255) | UNIQUE, NOT NULL   |
| password      | 비밀번호(BCrypt)                       | VARCHAR(255) | NULL 허용(소셜)    |
| nick_name     | 닉네임                                 | VARCHAR(255) | NOT NULL           |
| user_email    | 이메일                                 | VARCHAR(255) | NOT NULL           |
| profile_photo | 프로필 사진 URL                        | VARCHAR(255) | —                  |
| introduction  | 자기소개                               | TEXT         | —                  |
| role          | 권한 (USER/ADMIN)                      | VARCHAR(30)  | NOT NULL           |
| provider      | 인증 제공자 (LOCAL/GOOGLE/KAKAO/NAVER) | VARCHAR(30)  | NOT NULL           |
| provider_id   | 소셜 고유 ID                           | VARCHAR(255) | —                  |
| deleted_at    | 소프트 삭제 시각                       | DATETIME     | —                  |
| created_at    | 생성 시각                              | DATETIME     | NOT NULL           |

#### `post` 테이블

| 물리명     | 논리명               | 타입         | PK/FK/기타         |
| ---------- | -------------------- | ------------ | ------------------ |
| id         | 포스트 PK            | BIGINT       | PK, AUTO_INCREMENT |
| user_id    | 작성자 ID            | BIGINT       | NOT NULL           |
| title      | 제목                 | VARCHAR(255) | NOT NULL           |
| content    | 본문(BlockNote JSON) | TEXT         | —                  |
| is_active  | 활성 여부            | TINYINT(1)   | DEFAULT 1          |
| deleted_at | 소프트 삭제 시각     | DATETIME     | —                  |
| created_at | 생성 시각            | DATETIME     | NOT NULL           |
| updated_at | 수정 시각            | DATETIME     | —                  |

#### `comment` 테이블

| 물리명     | 논리명               | 타입         | PK/FK/기타         |
| ---------- | -------------------- | ------------ | ------------------ |
| id         | 댓글 PK              | BIGINT       | PK, AUTO_INCREMENT |
| comment_id | 부모 댓글 ID(대댓글) | BIGINT       | —                  |
| content    | 내용                 | VARCHAR(500) | NOT NULL           |
| post_id    | 포스트 FK            | BIGINT       | FK → post.id       |
| user_id    | 작성자 FK            | BIGINT       | FK → user.id       |
| deleted_at | 소프트 삭제 시각     | DATETIME     | —                  |

#### `playlist` / `playlist_item` 테이블

| 물리명  | 논리명          | 타입         | PK/FK/기타         |
| ------- | --------------- | ------------ | ------------------ |
| id      | 플레이리스트 PK | BIGINT       | PK, AUTO_INCREMENT |
| user_id | 소유자 ID       | BIGINT       | NOT NULL           |
| title   | 제목            | VARCHAR(255) | NOT NULL           |

| 물리명    | 논리명          | 타입         | PK/FK/기타         |
| --------- | --------------- | ------------ | ------------------ |
| id        | 아이템 PK       | BIGINT       | PK, AUTO_INCREMENT |
| play_id   | 플레이리스트 FK | BIGINT       | FK → playlist.id   |
| title     | 곡명            | VARCHAR(255) | NOT NULL           |
| link      | YouTube 링크    | VARCHAR(255) | NOT NULL           |
| thumbnail | 썸네일 URL      | VARCHAR(255) | —                  |
| seq       | 재생 순서       | INT          | —                  |

#### `notification` 테이블

| 물리명     | 논리명              | 타입         | PK/FK/기타         |
| ---------- | ------------------- | ------------ | ------------------ |
| id         | 알림 PK             | BIGINT       | PK, AUTO_INCREMENT |
| user_id    | 수신자 FK           | BIGINT       | FK → user.id       |
| type       | 알림 유형           | VARCHAR(30)  | NOT NULL           |
| title      | 알림 제목           | VARCHAR(100) | NOT NULL           |
| message    | 알림 메시지         | VARCHAR(500) | NOT NULL           |
| related_id | 관련 ID (postId 등) | BIGINT       | —                  |
| read_at    | 읽음 처리 시각      | DATETIME     | —                  |
| created_at | 생성 시각           | DATETIME     | NOT NULL           |

#### `auth_session` 테이블 (Refresh Token)

| 물리명        | 논리명             | 타입         | PK/FK/기타         |
| ------------- | ------------------ | ------------ | ------------------ |
| id            | 세션 PK            | BIGINT       | PK, AUTO_INCREMENT |
| user_id       | 사용자 FK          | BIGINT       | FK → user.id       |
| session_token | UUID Refresh Token | VARCHAR(255) | UNIQUE             |
| expires_at    | 만료 시각          | DATETIME     | NOT NULL           |

---

<span id="ko-sequence"></span>

### 🔄 핵심 로직 시퀀스 다이어그램

#### 스마트 검색 흐름

```
사용자           Frontend          Spring Boot         Gemini API        MySQL
  │                 │                  │                    │               │
  │─ 검색어 입력 ─▶│                  │                    │               │
  │                 │─ GET /api/search?q= ─▶│              │               │
  │                 │                  │─ 1. 검색어 정규화  │               │
  │                 │                  │─ 2. Gemini 의도분석 ────────────▶│
  │                 │                  │◀─ 검색의도·관련태그 반환 ──────────│
  │                 │                  │─ 3. CommonCode 태그 필터링 ──────▶│
  │                 │                  │─ 4. 태그 기반 Post 검색 ─────────▶│
  │                 │                  │─ 5. DSW 유사도 점수화·랭킹         │
  │                 │◀─ SmartSearchResponseDto ─│          │               │
  │◀─ 결과 렌더링 ─│                  │                    │               │
```

#### 포스트 작성 흐름 (JWT 인증 포함)

```
사용자           Frontend          Spring Boot        MySQL           SFTP
  │                 │                  │                  │             │
  │─ 로그인 ──────▶│                  │                  │             │
  │                 │─ POST /api/auth/login ────────────▶│             │
  │                 │◀─ { token } + Set-Cookie ──────────│             │
  │─ 이미지 삽입 ─▶│                  │                  │             │
  │                 │─ POST /api/files/upload ──────────────────────────▶│
  │                 │◀──────────────────────────── { url } ─────────────│
  │─ 포스트 저장 ─▶│                  │                  │             │
  │                 │─ POST /api/posts (Bearer token) ──▶│             │
  │                 │                  │─ JWT 검증        │             │
  │                 │                  │─ Post·PostTag 저장 ───────────▶│
  │                 │◀─ 200: postId ───│                  │             │
```

#### YouTube 플레이리스트 임포트 흐름

```
사용자           Frontend          Spring Boot       YouTube API      yt-dlp
  │                 │                  │                  │              │
  │─ URL 입력 ────▶│                  │                  │              │
  │                 │─ POST /api/playlists/import-yt ───▶│              │
  │                 │                  │─ 메타데이터 요청 ─────────────▶│
  │                 │                  │◀─ 트랙 정보 반환 ───────────────│
  │                 │                  │─ (필요 시) yt-dlp 실행 ──────────▶│
  │                 │◀─ List<PlaylistItemDto> ─│          │              │
  │─ 가져오기 확정 ▶│                  │                  │              │
  │                 │─ POST /api/playlists/{id}/items/batch ─▶│         │
  │                 │◀─ 200 OK ────────│                  │              │
```

</details>

---

<span id="ko-getting-started"></span>

### 🚀 시작하기

#### 필요 조건

- Node.js v16+
- Java 21+ (Spring 백엔드 실행 시)
- npm 또는 yarn

#### 설치 및 실행

**1. 저장소 클론 및 의존성 설치**

```bash
git clone https://github.com/QCoQCo/LogBook.git
cd LogBook
cd logBook && npm install
```

**2. 환경 변수 설정**

프로젝트 루트에 `.env` 파일을 만들고 [설정 가이드](#ko-config) 참고

**3. 프론트엔드 개발 서버**

```bash
cd logBook
npm run dev
# 또는 지정 포트: npm run dev -- --port 3000
```

**4. 백엔드 실행 (선택)**

```bash
cd spring
./gradlew bootRun
```

**5. 브라우저에서 `http://localhost:5173` 접속**

#### 🔧 백엔드 실행 가이드

#### 사전 준비

- **Java 21** 이상 / **Gradle 8.x**
- **MySQL 8** (또는 Aiven Cloud 계정)
- 프로젝트 루트 `.env` 파일 설정

#### 환경 변수 (`.env`)

```env
# DB
db.host=YOUR_MYSQL_HOST
db.port=3306
db.name=logbook
db.username=YOUR_DB_USER
db.password=YOUR_DB_PASSWORD

# SFTP
sftp.host=YOUR_SFTP_HOST
sftp.port=22
sftp.username=YOUR_SFTP_USER
sftp.password=YOUR_SFTP_PASSWORD
sftp.uploadPath=images

# Gemini AI
LLM_GOOGLE_API_KEY=YOUR_GEMINI_API_KEY

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=YOUR_GMAIL
SMTP_PASSWORD=YOUR_APP_PASSWORD

# OAuth2
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
KAKAO_CLIENT_ID=YOUR_KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET=YOUR_KAKAO_CLIENT_SECRET
NAVER_CLIENT_ID=YOUR_NAVER_CLIENT_ID
NAVER_CLIENT_SECRET=YOUR_NAVER_CLIENT_SECRET

# YouTube / Firebase
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
```

#### 빌드 및 실행

```bash
cd spring

# 빌드 (테스트 제외)
./gradlew build -x test

# 서버 실행 (포트 8080, context-path /api)
./gradlew bootRun
```

```bash
# 기동 확인
curl http://localhost:8080/api/posts
```

#### 동시 실행 (개발 편의)

```bash
# 터미널 1: 백엔드
cd spring && ./gradlew bootRun

# 터미널 2: 프론트엔드
cd logBook && npm run dev
```

> **메모리 최적화**: `build.gradle`에 `-Xms128m -Xmx384m -XX:+UseG1GC` 옵션 적용으로 IntelliJ 동시 실행 시 메모리 압박 최소화

#### 포트 구성

| 서비스               | 포트  | 설명                |
| -------------------- | ----- | ------------------- |
| Spring Boot API      | 8080  | `/api` context-path |
| React Vite 개발 서버 | 5173  | 개발 환경           |
| MySQL (Aiven Cloud)  | 16606 | 원격 DB             |
| SFTP 파일 서버       | 2222  | NAS 이미지 서버     |

---

<span id="ko-config"></span>

### 🔧 설정 가이드

프로젝트 루트의 `.env` 파일에 아래 항목을 설정합니다. 실제 키/비밀번호는 저장소에 올리지 마세요.

| 구분         | 변수 예시                                                                           | 설명                    |
| ------------ | ----------------------------------------------------------------------------------- | ----------------------- |
| **Firebase** | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` 등 | Firebase 콘솔에서 발급  |
| **DB**       | `db.host`, `db.port`, `db.name`, `db.username`, `db.password`                       | MySQL 연결 정보         |
| **OAuth**    | `GOOGLE_CLIENT_ID`, `KAKAO_CLIENT_ID`, `NAVER_CLIENT_ID` 및 각 `_SECRET`            | 각 개발자 콘솔에서 발급 |
| **SMTP**     | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`                          | 이메일 발송용           |
| **API**      | `VITE_GOOGLE_MAPS_API_KEY`, `YOUTUBE_API_KEY`                                       | 지도·YouTube 연동       |

`.env.example`이 있다면 복사한 뒤 값을 채워 사용하세요.

---

<span id="ko-usage"></span>

### 🎯 사용법

- **블로그**: 로그인 후 블로그 메뉴에서 드래그 앤 드롭으로 레이아웃 구성 후 발행
- **채팅**: 채팅 메뉴에서 방 생성/참여 후 실시간 메시지
- **플레이리스트**: YouTube 검색 후 곡 추가, 팝업 플레이어로 재생
- **마크다운 글**: Velog 스타일 에디터로 작성 후 미리보기·발행

---

<span id="ko-contribute"></span>

### 🤝 기여하기

- **버그·기능 제안**: [Issues](https://github.com/QCoQCo/LogBook/issues)
- **Pull Request**: fork → 브랜치 생성 → 변경 후 PR
- **코드 스타일**: Prettier / ESLint, Conventional Commits 권장
- **테스트**: 새로운 기능에는 테스트 코드 포함
- **문서**: README와 코드 주석 업데이트

---

<span id="ko-license"></span>

### 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. [LICENSE](LICENSE) 참조.

---

### 👥 $KULL 팀

- **조장**: [CO_s_MOS](https://github.com/QCoQCo)
- **조원**: [BH](https://github.com/devbhkim0707), [KyeongTaeHyeon](https://github.com/KyeongTaeHyeon)

[NOTION](https://www.notion.so/KULL-24f27e5202b980279044dafa45b829d6?pvs=25) · [GITHUB](https://github.com/QCoQCo/LogBook)

---

### 🗺️ 로드맵

- **v1.0**: 기본 블로그, 실시간 채팅, YouTube 플레이리스트, 마크다운 에디터 ✅
- **v1.1 (계획)**: 팔로우, 좋아요/댓글, 알림, 다크모드
- **v2.0 (예정)**: 모바일 앱, 고급 템플릿, API 분리

---

<div align="center">

[⬆️ 맨 위로 / トップへ](#-logbook-)

</div>

---

<span id="readme-ja"></span>

## 🇯🇵 日本語

### 🗺️ 目次

- [⚓ プロジェクト紹介](#ja-proj-intro)
- [📁 プロジェクト構成](#ja-proj-structure)
- [📋 要件定義書](#ja-requirements)
- [🏴‍☠️ 主な機能](#ja-features)
- [⚡ 技術スタック](#ja-tech-stack)
- [🏗️ システムアーキテクチャ](#ja-architecture)
- [📡 API仕様書](#ja-api)
- [🗄️ ERD・テーブル定義書](#ja-erd)
- [🔄 シーケンス図](#ja-sequence)
- [🚀 はじめに](#ja-getting-started)
- [🔧 設定ガイド](#ja-config)
- [🎯 使い方](#ja-usage)
- [🤝 コントリビュート](#ja-contribute)
- [📄 ライセンス](#ja-license)

---

<span id="ja-proj-intro"></span>

### ⚓ プロジェクト紹介

**LogBook**は、海賊の航海日誌をモチーフにしたソーシャルブログプラットフォームです。  
海のように自由なブログデザインと、リアルタイムでつながれる環境を提供します。

#### 🌟 LogBookの特徴

- **🎨 デザインの自由度**: React Grid Layoutでドラッグ＆ドロップ、レイアウトを自由に構成
- **💬 リアルタイム通信**: Firebaseチャット + Spring Boot API
- **🎵 音楽と一緒に**: YouTubeプレイリストでブログ執筆
- **📝 使いやすいエディタ**: Velog風マークダウンエディタ、リアルタイムプレビュー
- **👤 ソーシャルログイン**: Google / Kakao / Naver OAuth2対応

---

<span id="ja-proj-structure"></span>

### 📁 プロジェクト構成

```
PJ02/
├── logBook/                 # React フロントエンド (Vite + React)
│   ├── public/
│   │   └── img/
│   └── src/
│       ├── components/      # ページ・UIコンポーネント
│       ├── context/         # React Context（認証、投稿など）
│       ├── hooks/           # カスタムフック
│       ├── pages/
│       └── ...
├── spring/                  # Spring Boot バックエンド
│   └── src/main/java/com/skull/logbook/
│       ├── controller/      # REST APIコントローラー
│       ├── service/         # ビジネスロジック
│       ├── entity/          # JPAエンティティ
│       ├── repository/      # データアクセス層
│       └── config/          # セキュリティ、WebSocket等の設定
├── .env                     # 環境変数 (Firebase, DB, OAuth, APIキー等)
└── README.md
```

---

<span id="ja-requirements"></span>

### 📋 要件定義書

| 機能ID | 機能詳細説明                                                                     | 重要度 |
| ------ | -------------------------------------------------------------------------------- | ------ |
| REQ-01 | メール認証ベースのローカル会員登録（コード送信→検証→登録）                       | 高     |
| REQ-02 | Google / Kakao / Naver OAuth2ソーシャルログイン                                  | 高     |
| REQ-03 | JWT Access Token（短期）+ Refresh Token（HttpOnly Cookie、7日）二重発行          | 高     |
| REQ-04 | トークン自動更新（`/api/auth/refresh`）                                          | 高     |
| REQ-05 | パスワード変更 / ID・パスワード検索                                              | 中     |
| REQ-06 | ユーザープロフィール編集（ニックネーム、紹介、プロフィール写真SFTPアップロード） | 中     |
| REQ-07 | フォロー / アンフォロー及びフォロー状態照会                                      | 中     |
| REQ-08 | ブロックエディタ（BlockNote）ベース投稿作成・編集・ソフト削除                    | 高     |
| REQ-09 | 投稿一覧ページネーション照会（フィルター・タグ検索含む）                         | 高     |
| REQ-10 | Gemini AIベーススマート検索（意図分析+タグマッチング）                           | 高     |
| REQ-11 | 投稿いいねトグル（重複防止）                                                     | 中     |
| REQ-12 | コメント作成・編集・ソフト削除（返信対応）                                       | 中     |
| REQ-13 | YouTube URLベースプレイリストインポート                                          | 高     |
| REQ-14 | プレイリストCRUD及びトラック順序一括変更                                         | 中     |
| REQ-15 | Firebaseベースリアルタイムチャット（公開・非公開室）                             | 高     |
| REQ-16 | チャットルーム作成・削除・パスワード検証                                         | 中     |
| REQ-17 | 通知（Notification）作成・照会・既読処理                                         | 中     |
| REQ-18 | リンクプレビューメタデータパース（Jsoup）                                        | 低     |
| REQ-19 | 不正投稿通報受付                                                                 | 低     |
| REQ-20 | 管理者（ADMIN）ユーザー一覧・統計・投稿管理                                      | 高     |
| REQ-21 | ダークモードトグル（ローカルストレージ永続）                                     | 低     |
| REQ-22 | Google Maps APIベース地図位置表示                                                | 低     |

---

<span id="ja-features"></span>

### 🏴‍☠️ 主な機能

| 領域         | 機能                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| **ブログ**   | React Grid Layoutでドラッグ＆ドロップ、画像/テキスト/リンク/地図コンポーネント、リアルタイムプレビュー |
| **チャット** | Firebaseによる複数チャットルーム、リアルタイムメッセージ、参加者管理                                   |
| **音楽**     | YouTube API連携プレイリスト、ポップアッププレイヤー                                                    |
| **執筆**     | Velog風マークダウンエディタ、コードハイライト、画像アップロード                                        |
| **認証**     | メールログイン、Google / Kakao / Naver OAuth2                                                          |

#### 📝 ブログエディタ

- **リアルタイムプレビュー**で即座に結果確認
- **レスポンシブデザイン**自動適用
- **ドラッグ＆ドロップ**グリッドレイアウト

#### 💬 リアルタイムチャットシステム

- **複数チャットルーム**の作成・管理
- **リアルタイムメッセージ**送受信
- **ユーザー状態管理**（オンライン/オフライン）
- **メッセージ削除**・編集機能

#### 🎵 YouTube音楽プレイリスト

- **YouTube API**連携で無制限の音楽検索
- **ポップアッププレイヤー**でブログ執筆中も音楽鑑賞
- **個人プレイリスト**の作成・管理

#### 👤 ソーシャルプロフィールシステム

- **個人プロフィール**のカスタマイズ
- **他ユーザーのプロフィール**訪問
- **ブログ、チャット、投稿**の統合管理

---

<span id="ja-tech-stack"></span>

### ⚡ 技術スタック

#### フロントエンド

| 技術              | バージョン | 用途                       |
| ----------------- | ---------- | -------------------------- |
| React             | ^19.1.1    | UIライブラリ               |
| Vite              | ^7.1.2     | ビルドツール               |
| React Router      | ^7.8.1     | SPAルーティング            |
| SCSS              | -          | スタイリング               |
| React Grid Layout | ^1.5.2     | ドラッグ＆ドロップグリッド |
| React Markdown    | ^10.1.0    | マークダウンレンダリング   |
| Swiper            | ^12.1.2    | スライダー/カルーセル      |
| Axios             | ^1.11.0    | HTTPクライアント           |
| Firebase          | ^12.1.0    | 認証、Firestore            |

#### バックエンド

| 技術             | 用途   |
| ---------------- | ------ | -------------------------- |
| Spring Boot      | ^4.0.1 | バックエンドフレームワーク |
| Spring Security  | -      | 認証/認可                  |
| Spring WebSocket | -      | リアルタイム通信           |
| JPA / MySQL      | -      | データベース               |
| JWT              | -      | トークンベース認証         |
| OAuth2           | -      | ソーシャルログイン         |

#### その他

- **SMTP**: メール送信
- **YouTube Data API**: 音楽検索
- **Google Maps API**: 地図コンポーネント

---

<span id="ja-architecture"></span>

### 🏗️ システムアーキテクチャ

```
[クライアント（ブラウザ）]
        │
        │ HTTPS（ポート443→プロキシ）
        ▼
[Nginx / Reverse Proxy]
  ├── /                  →  React SPA（静的ビルド dist/）
  ├── /api/*             →  Spring Boot（http://backend:8080）
  └── /oauth2/*          →  Spring OAuth2リダイレクト処理
        │
        ├─── [Spring Boot バックエンド] :8080 (context-path: /api)
        │         ├── Spring Security（JWTフィルターチェーン）
        │         ├── OAuth2 Client（Google/Kakao/Naver）
        │         ├── JPA / Hibernate
        │         │         └── [MySQL 8 — Aiven Cloud] :16606
        │         ├── SFTP Client（JSch）→ [NASファイルサーバー] :2222
        │         ├── Gmail SMTP → [メール認証送信]
        │         ├── Gemini API（Google AI）→ [スマート検索]
        │         ├── YouTube Data API v3 → [プレイリストインポート]
        │         └── WebSocket（STOMP）→ [通知リアルタイムPush]
        │
        └─── [Firebase Realtime DB]（チャットメッセージ永続・リアルタイム同期）

[フロー概要]
ユーザーリクエスト → Nginx → React SPA または /api ルーティング
/api リクエスト   → Spring Boot → JWT検証 → ビジネスロジック → MySQL 読み書き
ファイルアップロード → Spring Boot → SFTP → NASサーバー保存
チャットメッセージ → Firebase SDK（クライアント直接書き込み/読み取り）
スマート検索 → Spring Boot → Gemini API呼び出し → 結果タグマッピング
```

---

<span id="ja-api"></span>

### 📡 API仕様書

<details>
<summary>クリックして展開</summary>

#### メニュー構造図

```
LogBook
├── ホーム (/)
├── 投稿 (/posts, /posts/:id, /write, /edit/:id)
├── ブログ (/:loginId/blog)
├── チャット (/chat, /chat/:roomId)
├── スマート検索 (/search)
├── 通知 (/notifications)
├── 管理者 (/admin)  [ADMIN権限専用]
└── アカウント (/login, /signup, /profile)
```

#### 認証 (`/api/auth`)

| URLパス                     | Method | パラメータ                                           | 戻り値                         |
| --------------------------- | ------ | ---------------------------------------------------- | ------------------------------ |
| `/api/auth/email/send`      | POST   | `{ email }`                                          | `{ message }`                  |
| `/api/auth/email/verify`    | POST   | `{ email, code }`                                    | `{ verified, token }`          |
| `/api/auth/signup`          | POST   | `SignupRequestDto`                                   | `{ message, userId }`          |
| `/api/auth/login`           | POST   | `{ loginId, password }`                              | `{ token, user }` + Set-Cookie |
| `/api/auth/logout`          | POST   | Cookie: `refreshToken`                               | `{ message }`                  |
| `/api/auth/refresh`         | POST   | Cookie: `refreshToken`                               | `{ token }`                    |
| `/api/auth/change-password` | POST   | `{ userId, oldPassword, newPassword }`               | `{ message }`                  |
| `/api/auth/find-id`         | POST   | `{ email }`                                          | `{ loginId }`                  |
| `/api/auth/reset-password`  | POST   | `{ verificationToken, email, loginId, newPassword }` | `{ message }`                  |

#### 投稿 (`/api/posts`)

| URLパス                        | Method | パラメータ                 | 戻り値                     |
| ------------------------------ | ------ | -------------------------- | -------------------------- |
| `/api/posts`                   | GET    | `page, size, filter`       | `List<PostResponseDto>`    |
| `/api/posts`                   | POST   | `PostRequestDto`（認証）   | `Long` (postId)            |
| `/api/posts/{postId}`          | GET    | —                          | `PostResponseDto`          |
| `/api/posts/{postId}`          | PUT    | `PostRequestDto`（所有者） | `204`                      |
| `/api/posts`                   | DELETE | `{ postId }`（所有者）     | `204`                      |
| `/api/posts/{postId}/like`     | POST   | 認証                       | `{ likeCount, isLiked }`   |
| `/api/posts/{postId}/like`     | DELETE | 認証                       | `{ likeCount, isLiked }`   |
| `/api/posts/lists/{userId}`    | GET    | `Pageable`                 | `Page<UserPostListDto>`    |
| `/api/posts/{postId}/comments` | GET    | —                          | `List<CommentResponseDto>` |

#### ユーザー (`/api/users`)

| URLパス                      | Method | パラメータ                             | 戻り値                       |
| ---------------------------- | ------ | -------------------------------------- | ---------------------------- |
| `/api/users/{loginId}`       | GET    | —                                      | `UserResponseDto`            |
| `/api/users/{userId}`        | PUT    | `file, introduction, nickName, layout` | `{ profilePhoto, nickName }` |
| `/api/users/{userId}/follow` | POST   | 認証                                   | `{ following }`              |
| `/api/users/{userId}/follow` | DELETE | 認証                                   | `{ following }`              |

#### プレイリスト (`/api/playlists`)

| URLパス                                   | Method | パラメータ                       | 戻り値                      |
| ----------------------------------------- | ------ | -------------------------------- | --------------------------- |
| `/api/playlists`                          | POST   | `PlaylistRequestDto`（認証）     | `PlaylistResponseDto`       |
| `/api/playlists`                          | GET    | `userId`                         | `List<PlaylistResponseDto>` |
| `/api/playlists/{playlistId}`             | GET    | —                                | `PlaylistDetailDto`         |
| `/api/playlists/{playlistId}/items`       | POST   | `PlaylistItemRequestDto`（認証） | `PlaylistItemResponseDto`   |
| `/api/playlists/{playlistId}/items/batch` | PATCH  | `List<PlaylistItemRequestDto>`   | `{ message }`               |
| `/api/playlists/import-yt`                | POST   | `{ playlistUrl }`（認証）        | `List<PlaylistItemDto>`     |

#### チャット / 通知 / 検索

| URLパス                           | Method | 説明                       | 戻り値                          |
| --------------------------------- | ------ | -------------------------- | ------------------------------- |
| `/api/chat/chat-rooms`            | GET    | チャットルーム一覧         | `{ chatRooms }`                 |
| `/api/chat/chat-rooms`            | POST   | チャットルーム作成（認証） | `ChatRoomDto`                   |
| `/api/chat/chat-rooms/{id}`       | DELETE | チャットルーム削除（認証） | `{ message }`                   |
| `/api/notifications`              | GET    | 通知一覧（認証）           | `Page<NotificationResponseDto>` |
| `/api/notifications/unread-count` | GET    | 未読通知数                 | `Long`                          |
| `/api/notifications/{id}/read`    | PATCH  | 単件既読処理               | `204`                           |
| `/api/notifications/read-all`     | PATCH  | 全件既読処理               | `204`                           |
| `/api/search`                     | GET    | `q`パラメータスマート検索  | `SmartSearchResponseDto`        |
| `/api/files/upload`               | POST   | SFTP画像アップロード       | `{ url }`                       |

</details>

---

<span id="ja-erd"></span>

### 🗄️ ERD・テーブル定義書

#### ERD関係概要

```
user ──1:1── blog
user ──1:N── post
user ──1:N── comment
user ──1:N── playlist
user ──M:N── post_like
user ──M:N── user_follow
post ──1:N── comment
post ──1:N── post_tag
post ──1:N── search_metadata
playlist ──1:N── playlist_item
user ──1:N── notification
user ──1:N── auth_session (Refresh Token)
```

#### `user` テーブル

| 物理名        | 論理名                                     | 型           | PK/FK/その他         |
| ------------- | ------------------------------------------ | ------------ | -------------------- |
| id            | ユーザーPK                                 | BIGINT       | PK, AUTO_INCREMENT   |
| login_id      | ログインID                                 | VARCHAR(255) | UNIQUE, NOT NULL     |
| password      | パスワード（BCrypt）                       | VARCHAR(255) | NULL可（ソーシャル） |
| nick_name     | ニックネーム                               | VARCHAR(255) | NOT NULL             |
| user_email    | メール                                     | VARCHAR(255) | NOT NULL             |
| profile_photo | プロフィール写真URL                        | VARCHAR(255) | —                    |
| introduction  | 自己紹介                                   | TEXT         | —                    |
| role          | 権限（USER/ADMIN）                         | VARCHAR(30)  | NOT NULL             |
| provider      | 認証プロバイダ（LOCAL/GOOGLE/KAKAO/NAVER） | VARCHAR(30)  | NOT NULL             |
| provider_id   | ソーシャル固有ID                           | VARCHAR(255) | —                    |
| deleted_at    | ソフト削除日時                             | DATETIME     | —                    |
| created_at    | 作成日時                                   | DATETIME     | NOT NULL             |

#### `post` テーブル

| 物理名     | 論理名                 | 型           | PK/FK/その他       |
| ---------- | ---------------------- | ------------ | ------------------ |
| id         | 投稿PK                 | BIGINT       | PK, AUTO_INCREMENT |
| user_id    | 著者ID                 | BIGINT       | NOT NULL           |
| title      | タイトル               | VARCHAR(255) | NOT NULL           |
| content    | 本文（BlockNote JSON） | TEXT         | —                  |
| is_active  | 有効フラグ             | TINYINT(1)   | DEFAULT 1          |
| deleted_at | ソフト削除日時         | DATETIME     | —                  |
| created_at | 作成日時               | DATETIME     | NOT NULL           |
| updated_at | 更新日時               | DATETIME     | —                  |

#### `comment` テーブル

| 物理名     | 論理名               | 型           | PK/FK/その他       |
| ---------- | -------------------- | ------------ | ------------------ |
| id         | コメントPK           | BIGINT       | PK, AUTO_INCREMENT |
| comment_id | 親コメントID（返信） | BIGINT       | —                  |
| content    | 内容                 | VARCHAR(500) | NOT NULL           |
| post_id    | 投稿FK               | BIGINT       | FK → post.id       |
| user_id    | 著者FK               | BIGINT       | FK → user.id       |
| deleted_at | ソフト削除日時       | DATETIME     | —                  |

#### `playlist` / `playlist_item` テーブル

| 物理名  | 論理名         | 型           | PK/FK/その他       |
| ------- | -------------- | ------------ | ------------------ |
| id      | プレイリストPK | BIGINT       | PK, AUTO_INCREMENT |
| user_id | 所有者ID       | BIGINT       | NOT NULL           |
| title   | タイトル       | VARCHAR(255) | NOT NULL           |

| 物理名    | 論理名         | 型           | PK/FK/その他       |
| --------- | -------------- | ------------ | ------------------ |
| id        | アイテムPK     | BIGINT       | PK, AUTO_INCREMENT |
| play_id   | プレイリストFK | BIGINT       | FK → playlist.id   |
| title     | 曲名           | VARCHAR(255) | NOT NULL           |
| link      | YouTubeリンク  | VARCHAR(255) | NOT NULL           |
| thumbnail | サムネイルURL  | VARCHAR(255) | —                  |
| seq       | 再生順序       | INT          | —                  |

#### `notification` テーブル

| 物理名     | 論理名             | 型           | PK/FK/その他       |
| ---------- | ------------------ | ------------ | ------------------ |
| id         | 通知PK             | BIGINT       | PK, AUTO_INCREMENT |
| user_id    | 受信者FK           | BIGINT       | FK → user.id       |
| type       | 通知タイプ         | VARCHAR(30)  | NOT NULL           |
| title      | 通知タイトル       | VARCHAR(100) | NOT NULL           |
| message    | 通知メッセージ     | VARCHAR(500) | NOT NULL           |
| related_id | 関連ID（postId等） | BIGINT       | —                  |
| read_at    | 既読日時           | DATETIME     | —                  |
| created_at | 作成日時           | DATETIME     | NOT NULL           |

#### `auth_session` テーブル (Refresh Token)

| 物理名        | 論理名             | 型           | PK/FK/その他       |
| ------------- | ------------------ | ------------ | ------------------ |
| id            | セッションPK       | BIGINT       | PK, AUTO_INCREMENT |
| user_id       | ユーザーFK         | BIGINT       | FK → user.id       |
| session_token | UUID Refresh Token | VARCHAR(255) | UNIQUE             |
| expires_at    | 有効期限           | DATETIME     | NOT NULL           |

---

<span id="ja-sequence"></span>

### 🔄 シーケンス図

#### スマート検索フロー

```
ユーザー           Frontend          Spring Boot         Gemini API        MySQL
  │                 │                  │                    │               │
  │─ 検索語入力 ─▶│                  │                    │               │
  │                 │─ GET /api/search?q= ─▶│              │               │
  │                 │                  │─ 1. 検索語正規化  │               │
  │                 │                  │─ 2. Gemini意図分析 ────────────▶│
  │                 │                  │◀─ 検索意図・関連タグ返却 ──────────│
  │                 │                  │─ 3. CommonCodeタグフィルタ ──────▶│
  │                 │                  │─ 4. タグベースPost検索 ─────────▶│
  │                 │                  │─ 5. DSW類似度スコア・ランキング   │
  │                 │◀─ SmartSearchResponseDto ─│          │               │
  │◀─ 結果レンダリング ─│                  │                    │               │
```

#### 投稿作成フロー（JWT認証含む）

```
ユーザー           Frontend          Spring Boot        MySQL           SFTP
  │                 │                  │                  │             │
  │─ ログイン ────▶│                  │                  │             │
  │                 │─ POST /api/auth/login ────────────▶│             │
  │                 │◀─ { token } + Set-Cookie ──────────│             │
  │─ 画像挿入 ───▶│                  │                  │             │
  │                 │─ POST /api/files/upload ──────────────────────────▶│
  │                 │◀──────────────────────────── { url } ─────────────│
  │─ 投稿保存 ───▶│                  │                  │             │
  │                 │─ POST /api/posts (Bearer token) ──▶│             │
  │                 │                  │─ JWT検証        │             │
  │                 │                  │─ Post・PostTag保存 ───────────▶│
  │                 │◀─ 200: postId ───│                  │             │
```

#### YouTubeプレイリストインポートフロー

```
ユーザー           Frontend          Spring Boot       YouTube API      yt-dlp
  │                 │                  │                  │              │
  │─ URL入力 ─────▶│                  │                  │              │
  │                 │─ POST /api/playlists/import-yt ───▶│              │
  │                 │                  │─ メタデータ要求 ─────────────▶│
  │                 │                  │◀─ トラック情報返却 ───────────────│
  │                 │                  │─ （必要時）yt-dlp実行 ──────────▶│
  │                 │◀─ List<PlaylistItemDto> ─│          │              │
  │─ インポート確定 ▶│                  │                  │              │
  │                 │─ POST /api/playlists/{id}/items/batch ─▶│         │
  │                 │◀─ 200 OK ────────│                  │              │
```

---

<span id="ja-getting-started"></span>

### 🚀 はじめに

#### 必要環境

- Node.js v16以上
- Java 21以上（Springバックエンド実行時）
- npm または yarn

#### インストールと実行

**1. リポジトリのクローンと依存関係のインストール**

```bash
git clone https://github.com/QCoQCo/LogBook.git
cd LogBook
cd logBook && npm install
```

**2. 環境変数の設定**

プロジェクトルートに `.env` を作成し、[設定ガイド](#ja-config)を参照

**3. フロントエンド開発サーバー**

```bash
cd logBook
npm run dev
# またはポート指定: npm run dev -- --port 3000
```

**4. バックエンドの起動（任意）**

```bash
cd spring
./gradlew bootRun
```

**5. ブラウザで `http://localhost:5173` にアクセス**

#### 🔧 バックエンド実行ガイド

#### 事前準備

- **Java 21** 以上 / **Gradle 8.x**
- **MySQL 8**（または Aiven Cloud アカウント）
- プロジェクトルート `.env` ファイル設定

#### 環境変数（`.env`）

```env
# DB
db.host=YOUR_MYSQL_HOST
db.port=3306
db.name=logbook
db.username=YOUR_DB_USER
db.password=YOUR_DB_PASSWORD

# SFTP
sftp.host=YOUR_SFTP_HOST
sftp.port=22
sftp.username=YOUR_SFTP_USER
sftp.password=YOUR_SFTP_PASSWORD
sftp.uploadPath=images

# Gemini AI
LLM_GOOGLE_API_KEY=YOUR_GEMINI_API_KEY

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=YOUR_GMAIL
SMTP_PASSWORD=YOUR_APP_PASSWORD

# OAuth2
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
KAKAO_CLIENT_ID=YOUR_KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET=YOUR_KAKAO_CLIENT_SECRET
NAVER_CLIENT_ID=YOUR_NAVER_CLIENT_ID
NAVER_CLIENT_SECRET=YOUR_NAVER_CLIENT_SECRET

# YouTube / Firebase
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
```

#### ビルドと実行

```bash
cd spring

# ビルド（テスト除外）
./gradlew build -x test

# サーバー起動（ポート8080、context-path /api）
./gradlew bootRun
```

```bash
# 起動確認
curl http://localhost:8080/api/posts
```

#### 同時実行（開発用）

```bash
# ターミナル1: バックエンド
cd spring && ./gradlew bootRun

# ターミナル2: フロントエンド
cd logBook && npm run dev
```

> **メモリ最適化**: `build.gradle` に `-Xms128m -Xmx384m -XX:+UseG1GC` オプション適用で IntelliJ 同時実行時のメモリ負荷を軽減

#### ポート構成

| サービス                | ポート | 説明                |
| ----------------------- | ------ | ------------------- |
| Spring Boot API         | 8080   | `/api` context-path |
| React Vite 開発サーバー | 5173   | 開発環境            |
| MySQL (Aiven Cloud)     | 16606  | リモートDB          |
| SFTP ファイルサーバー   | 2222   | NAS 画像サーバー    |

---

<span id="ja-config"></span>

### 🔧 設定ガイド

プロジェクトルートの `.env` に以下の項目を設定します。実際のキー・パスワードはリポジトリに含めないでください。

| 区分         | 変数例                                                                              | 説明                     |
| ------------ | ----------------------------------------------------------------------------------- | ------------------------ |
| **Firebase** | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` 等 | Firebaseコンソールで発行 |
| **DB**       | `db.host`, `db.port`, `db.name`, `db.username`, `db.password`                       | MySQL接続情報            |
| **OAuth**    | `GOOGLE_CLIENT_ID`, `KAKAO_CLIENT_ID`, `NAVER_CLIENT_ID` および各 `_SECRET`         | 各開発者コンソールで発行 |
| **SMTP**     | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`                          | メール送信用             |
| **API**      | `VITE_GOOGLE_MAPS_API_KEY`, `YOUTUBE_API_KEY`                                       | 地図・YouTube連携        |

`.env.example` があればコピーし、値を設定して利用してください。

---

<span id="ja-usage"></span>

### 🎯 使い方

- **ブログ**: ログイン後、ブログメニューでドラッグ＆ドロップでレイアウトを組み、公開
- **チャット**: チャットメニューでルーム作成・参加後、リアルタイムでメッセージ
- **プレイリスト**: YouTubeで検索して曲を追加、ポップアッププレイヤーで再生
- **マークダウン記事**: Velog風エディタで執筆し、プレビュー・公開

---

<span id="ja-contribute"></span>

### 🤝 コントリビュート

- **バグ・機能提案**: [Issues](https://github.com/QCoQCo/LogBook/issues)
- **Pull Request**: fork → ブランチ作成 → 変更後にPR
- **コードスタイル**: Prettier / ESLint、Conventional Commits推奨
- **テスト**: 新機能にはテストコードを含める
- **ドキュメント**: READMEとコードコメントの更新

---

<span id="ja-license"></span>

### 📄 ライセンス

本プロジェクトはMITライセンスの下で配布されています。[LICENSE](LICENSE)を参照してください。

---

### 👥 $KULL チーム

- **リーダー**: [CO_s_MOS](https://github.com/QCoQCo)
- **メンバー**: [BH](https://github.com/devbhkim0707), [KyeongTaeHyeon](https://github.com/KyeongTaeHyeon)

[NOTION](https://www.notion.so/KULL-24f27e5202b980279044dafa45b829d6?pvs=25) · [GITHUB](https://github.com/QCoQCo/LogBook)

---

### 🗺️ ロードマップ

- **v1.0**: 基本ブログ、リアルタイムチャット、YouTubeプレイリスト、マークダウンエディタ ✅
- **v1.1（予定）**: フォロー、いいね/コメント、通知、ダークモード
- **v2.0（予定）**: モバイルアプリ、高度なテンプレート、API分離

---

<div align="center">

[⬆️ トップへ / 맨 위로](#-logbook-)

![GitHub stars](https://img.shields.io/github/stars/QCoQCo/LogBook?style=social) ![GitHub forks](https://img.shields.io/github/forks/QCoQCo/LogBook?style=social) ![GitHub last commit](https://img.shields.io/github/last-commit/QCoQCo/LogBook)

_Made with ❤️ by the LogBook Team_

</div>
