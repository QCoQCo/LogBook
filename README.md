# ☠️ LogBook 🏴‍☠️

### 해적의 항해일지 - 자유로운 소셜 블로그 플랫폼

<div align="center">

![LogBook Banner](./logBook/public/img/logBook_logo.png)

**🌊 바다처럼 자유롭고, 보물처럼 소중한 당신의 이야기를 기록하세요 ⚓**

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

[![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)](https://sass-lang.com/)

**백엔드 추가예정**

**🌊 바다처럼 자유롭고, 보물처럼 소중한 당신의 이야기를 기록하세요 ⚓**

[🎬 데모 보기](https://your-demo-link.com) · [📖 문서](https://github.com/QCoQCo/LogBook/wiki) · [🐛 버그 신고](https://github.com/QCoQCo/LogBook/issues) · [✨ 기능 요청](https://github.com/QCoQCo/LogBook/issues)

</div>

---

## 🗺️ 목차

- [⚓ 프로젝트 소개](#-프로젝트-소개)

- [📋 요구사항 정의서](#-요구사항-정의서)

- [🏴‍☠️ 주요 기능](#️-주요-기능)

- [⚡ 기술 스택](#-기술-스택)

- [🏗️ 시스템 아키텍처](#️-시스템-아키텍처)

- [� API 명세서](#-api-명세서)

- [🗄️ ERD 및 테이블 정의서](#️-erd-및-테이블-정의서)

- [🔄 핵심 로직 시퀀스 다이어그램](#-핵심-로직-시퀀스-다이어그램)

- [�🚀 시작하기](#-시작하기)

- [🔧 설정 가이드](#-설정-가이드)

- [🎯 사용법](#-사용법)

- [🤝 기여하기](#-기여하기)

- [📄 라이센스](#-라이센스)

---

## ⚓ 프로젝트 소개

**LogBook**은 해적의 항해일지에서 영감을 받아 만들어진 혁신적인 소셜 블로그 플랫폼입니다.

자유로운 바다처럼 제약 없는 블로그 디자인과 실시간 소통이 가능한 완전한 소셜 플랫폼을 제공합니다.

### 🌟 왜 LogBook인가?

- **🎨 완전한 자유도**: 드래그 앤 드롭으로 블로그를 원하는 대로 디자인

- **💬 실시간 소통**: Firebase 기반의 실시간 채팅으로 즉시 소통

- **🎵 감성적인 경험**: YouTube 음악과 함께하는 블로그 작성

- **📝 직관적인 에디터**: Velog 스타일의 친숙한 마크다운 편집기

- **👥 소셜 네트워킹**: 다른 사용자들의 프로필과 콘텐츠 탐색

---

## 📋 요구사항 정의서

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

## 🏴‍☠️ 주요 기능

### 🎨 자유로운 블로그 디자인

> React Grid Layout을 활용한 완전한 자유도의 블로그 에디터

- ✅ **드래그 앤 드롭** 인터페이스로 직관적인 레이아웃 구성

- ✅ **다양한 컴포넌트** 지원 (이미지, 텍스트, 링크, 지도 등)

- ✅ **실시간 미리보기**로 즉시 결과 확인

- ✅ **반응형 디자인** 자동 적용

### 💬 실시간 채팅 시스템

> Firebase Firestore 기반의 완전한 채팅 플랫폼

- ✅ **다중 채팅방** 생성 및 관리

- ✅ **실시간 메시지** 송수신

- ✅ **사용자 상태 관리** (온라인/오프라인)

- ✅ **메시지 삭제** 및 편집 기능

- ✅ **방 참여자 관리** 시스템

### 🎵 YouTube 음악 플레이리스트

> 음악과 함께하는 블로그 경험

- ✅ **YouTube API** 연동으로 무제한 음악 검색

- ✅ **팝업 플레이어**로 블로그 작성 중에도 음악 감상

- ✅ **Swiper 슬라이더**를 활용한 세련된 UI

- ✅ **개인 플레이리스트** 생성 및 관리

### 👤 소셜 프로필 시스템

> 다른 항해자들과의 연결

- ✅ **개인 프로필** 커스터마이징

- ✅ **다른 사용자 프로필** 방문

- ✅ **블로그, 채팅, 게시글** 통합 관리

- ✅ **팔로우/팔로워** 시스템 (예정)

### ⌨️ Velog 스타일 마크다운 편집기

> 개발자에게 친숙한 글쓰기 경험

- ✅ **실시간 마크다운 미리보기**

- ✅ **코드 하이라이팅** 지원

- ✅ **이미지 업로드** 및 관리

- ✅ **다양한 텍스트 스타일링** 옵션

---

## ⚡ 기술 스택

<div align="center">

### 🖥️ Frontend Technologies

<table>
<tr>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="60" height="60" alt="React"/>
<br/>
<strong>React</strong>
<br/>
<sub>^19.1.1</sub>
<br/>
<code>모던 React 기능 활용</code>
</td>
<td align="center" width="200">
<img src="https://vitejs.dev/logo.svg" width="60" height="60" alt="Vite"/>
<br/>
<strong>Vite</strong>
<br/>
<sub>^7.1.2</sub>
<br/>
<code>번개처럼 빠른 개발 환경</code>
</td>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg" width="60" height="60" alt="SCSS"/>
<br/>
<strong>SCSS</strong>
<br/>
<sub>Latest</sub>
<br/>
<code>고급 CSS 전처리기</code>
</td>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="60" height="60" alt="React Router"/>
<br/>
<strong>React Router</strong>
<br/>
<sub>^7.8.1</sub>
<br/>
<code>SPA 라우팅 시스템</code>
</td>
</tr>
</table>

### 🔥 Backend & Database

<table>
<tr>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="60" height="60" alt="Firebase"/>
<br/>
<strong>Firebase</strong>
<br/>
<sub>^12.1.0</sub>
<br/>
<code>Google BaaS 플랫폼</code>
</td>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="60" height="60" alt="Firestore"/>
<br/>
<strong>Firestore</strong>
<br/>
<sub>Latest</sub>
<br/>
<code>NoSQL 실시간 데이터베이스</code>
</td>
<td align="center" width="200">
<img src="https://img.icons8.com/color/60/000000/coming-soon.png" width="60" height="60" alt="Coming Soon"/>
<br/>
<strong>추가 예정</strong>
<br/>
<sub>Soon</sub>
<br/>
<code>백엔드 확장</code>
</td>
</tr>
</table>

### 🎨 UI/UX Libraries

<table>
<tr>
<td align="center" width="200">
<img src="https://swiperjs.com/images/swiper-logo.svg" width="60" height="60" alt="Swiper"/>
<br/>
<strong>Swiper</strong>
<br/>
<sub>^11.2.10</sub>
<br/>
<code>터치 슬라이더 라이브러리</code>
</td>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="60" height="60" alt="React Grid Layout"/>
<br/>
<strong>React Grid Layout</strong>
<br/>
<sub>^1.5.2</sub>
<br/>
<code>드래그 앤 드롭 그리드</code>
</td>
<td align="center" width="200">
<img src="https://img.icons8.com/color/60/000000/markdown.png" width="60" height="60" alt="React Markdown"/>
<br/>
<strong>React Markdown</strong>
<br/>
<sub>^10.1.0</sub>
<br/>
<code>마크다운 렌더링</code>
</td>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="60" height="60" alt="Axios"/>
<br/>
<strong>Axios</strong>
<br/>
<sub>^1.11.0</sub>
<br/>
<code>HTTP 클라이언트</code>
</td>
</tr>
</table>

### 🛠️ Development Tools

<table>
<tr>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="60" height="60" alt="JavaScript"/>
<br/>
<strong>JavaScript</strong>
<br/>
<sub>ES6+</sub>
<br/>
<code>모던 자바스크립트</code>
</td>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="60" height="60" alt="HTML5"/>
<br/>
<strong>HTML5</strong>
<br/>
<sub>Latest</sub>
<br/>
<code>시맨틱 마크업</code>
</td>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" width="60" height="60" alt="CSS3"/>
<br/>
<strong>CSS3</strong>
<br/>
<sub>Latest</sub>
<br/>
<code>스타일링</code>
</td>
<td align="center" width="200">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="60" height="60" alt="Git"/>
<br/>
<strong>Git</strong>
<br/>
<sub>Latest</sub>
<br/>
<code>버전 관리</code>
</td>
</tr>
</table>

### 📊 기술 스택 요약

<div align="center">

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

</div>

</div>

---

## 🏗️ 시스템 아키텍처

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

## 📡 API 명세서

### 메뉴 구조도

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

### 인증 (`/api/auth`)

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

### 포스트 (`/api/posts`)

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

### 사용자 (`/api/users`)

| URL 경로                     | Method | 파라미터                               | 반환 형식                    |
| ---------------------------- | ------ | -------------------------------------- | ---------------------------- |
| `/api/users/{loginId}`       | GET    | —                                      | `UserResponseDto`            |
| `/api/users/{userId}`        | PUT    | `file, introduction, nickName, layout` | `{ profilePhoto, nickName }` |
| `/api/users/{userId}/follow` | POST   | 인증                                   | `{ following }`              |
| `/api/users/{userId}/follow` | DELETE | 인증                                   | `{ following }`              |

### 플레이리스트 (`/api/playlists`)

| URL 경로                                  | Method | 파라미터                        | 반환 형식                   |
| ----------------------------------------- | ------ | ------------------------------- | --------------------------- |
| `/api/playlists`                          | POST   | `PlaylistRequestDto` (인증)     | `PlaylistResponseDto`       |
| `/api/playlists`                          | GET    | `userId`                        | `List<PlaylistResponseDto>` |
| `/api/playlists/{playlistId}`             | GET    | —                               | `PlaylistDetailDto`         |
| `/api/playlists/{playlistId}/items`       | POST   | `PlaylistItemRequestDto` (인증) | `PlaylistItemResponseDto`   |
| `/api/playlists/{playlistId}/items/batch` | PATCH  | `List<PlaylistItemRequestDto>`  | `{ message }`               |
| `/api/playlists/import-yt`                | POST   | `{ playlistUrl }` (인증)        | `List<PlaylistItemDto>`     |

### 채팅 / 알림 / 검색

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

## 🗄️ ERD 및 테이블 정의서

### ERD 관계 요약

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

### `user` 테이블

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

### `post` 테이블

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

### `comment` 테이블

| 물리명     | 논리명               | 타입         | PK/FK/기타         |
| ---------- | -------------------- | ------------ | ------------------ |
| id         | 댓글 PK              | BIGINT       | PK, AUTO_INCREMENT |
| comment_id | 부모 댓글 ID(대댓글) | BIGINT       | —                  |
| content    | 내용                 | VARCHAR(500) | NOT NULL           |
| post_id    | 포스트 FK            | BIGINT       | FK → post.id       |
| user_id    | 작성자 FK            | BIGINT       | FK → user.id       |
| deleted_at | 소프트 삭제 시각     | DATETIME     | —                  |

### `playlist` / `playlist_item` 테이블

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

### `notification` 테이블

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

### `auth_session` 테이블 (Refresh Token)

| 물리명        | 논리명             | 타입         | PK/FK/기타         |
| ------------- | ------------------ | ------------ | ------------------ |
| id            | 세션 PK            | BIGINT       | PK, AUTO_INCREMENT |
| user_id       | 사용자 FK          | BIGINT       | FK → user.id       |
| session_token | UUID Refresh Token | VARCHAR(255) | UNIQUE             |
| expires_at    | 만료 시각          | DATETIME     | NOT NULL           |

---

## 🔄 핵심 로직 시퀀스 다이어그램

### 스마트 검색 흐름

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

### 포스트 작성 흐름 (JWT 인증 포함)

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

### YouTube 플레이리스트 임포트 흐름

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

---

## 🚀 시작하기

### 📋 필요 조건

- **Node.js** v16.0.0 이상

- **npm** 또는 **yarn**

### 📦 설치

1. **저장소 클론**

```bash

git clone https://github.com/QCoQCo/LogBook.git

cd LogBook

```

2. **의존성 설치**

```bash

npm install

# 또는

yarn install

```

3. **개발 서버 실행**

```bash

npm run dev

# 임의 포트번호
npm run dev -- --port 포트번호

# 또는

yarn dev

```

4. **브라우저에서 확인**

```

http://localhost:5173
http://localhost:포트번호

```

### 🔧 백엔드 실행 가이드

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

## 🎯 사용법

### 🎨 블로그 만들기

1. **로그인** 후 '블로그' 메뉴로 이동

2. **드래그 앤 드롭**으로 원하는 위치에 요소 배치

3. **이미지, 텍스트, 링크** 등 다양한 컴포넌트 추가

4. **실시간 미리보기**로 결과 확인

### 💬 채팅하기

1. **채팅** 메뉴에서 채팅방 목록 확인

2. **새 채팅방 생성** 또는 기존 방 참여

3. **실시간으로 메시지** 주고받기

4. **방 설정**에서 참여자 관리

### 🎵 음악 플레이리스트

1. **플레이리스트** 메뉴로 이동

2. **YouTube에서 음악 검색** 후 추가

3. **팝업 플레이어**로 음악 감상하며 블로그 작성

4. **개인 플레이리스트** 관리

---

## 🤝 기여하기

LogBook 프로젝트에 기여해주세요! 🌊

### 🐛 버그 신고

- [Issues](https://github.com/QCoQCo/LogBook/issues)에서 버그 신고

- 재현 가능한 단계와 스크린샷 포함

### ✨ 기능 제안

- [Issues](https://github.com/QCoQCo/LogBook/issues)에서 새로운 기능 제안

- 상세한 설명과 사용 사례 포함

### 🔀 Pull Request

1. 이 저장소를 포크

2. 새로운 브랜치 생성 (`git checkout -b feature/amazing-feature`)

3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)

4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)

5. Pull Request 생성

### 📋 기여 가이드라인

- **코드 스타일**: Prettier와 ESLint 규칙 준수

- **커밋 메시지**: [Conventional Commits](https://www.conventionalcommits.org/) 형식 사용

- **테스트**: 새로운 기능에는 테스트 코드 포함

- **문서**: README와 코드 주석 업데이트

---

## 👥 기여자

<div align="center">

감사합니다, 모든 기여자들! 🙏

[![Contributors](https://contrib.rocks/image?repo=QCoQCo/LogBook)](https://github.com/QCoQCo/LogBook/graphs/contributors)

</div>

---

## $KULL

### 조장

[CO_s_MOS](https://github.com/QCoQCo)

### 조원

[BH](https://github.com/devbhkim0707)

[KyeongTaeHyeon](https://github.com/KyeongTaeHyeon)

---

## 📊 프로젝트 상태

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/QCoQCo/LogBook?style=social)

![GitHub forks](https://img.shields.io/github/forks/QCoQCo/LogBook?style=social)

![GitHub watchers](https://img.shields.io/github/watchers/QCoQCo/LogBook?style=social)

![GitHub last commit](https://img.shields.io/github/last-commit/QCoQCo/LogBook)

![GitHub issues](https://img.shields.io/github/issues/QCoQCo/LogBook)

![GitHub pull requests](https://img.shields.io/github/issues-pr/QCoQCo/LogBook)

</div>

---

## 🗺️ 로드맵

### 🚀 v1.0.0 (현재)

- ✅ 기본 블로그 시스템

- ✅ 실시간 채팅

- ✅ YouTube 플레이리스트

- ✅ 마크다운 편집기

### 🌟 v1.1.0 (계획중)

- 🔄 사용자 팔로우 시스템

- 🔄 게시글 좋아요/댓글

- 🔄 알림 시스템

- 🔄 다크모드 테마

### 🚀 v2.0.0 (예정)

- ⏳ 모바일 앱 버전

- ⏳ 고급 블로그 템플릿

- ⏳ API 서버 분리

- ⏳ 프리미엄 기능

---

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

<div align="center">

### ⚓ 함께 항해하는 개발자들을 위해

**LogBook**은 단순한 블로그 플랫폼이 아닙니다.

개발자들이 자신만의 이야기를 자유롭게 표현하고,

서로 소통하며 성장할 수 있는 **디지털 바다**입니다.

🌊 **당신의 항해일지를 시작하세요!** ⚓

---

_Made with ❤️ by the LogBook Team_

[NOTION](https://www.notion.so/KULL-24f27e5202b980279044dafa45b829d6?pvs=25)

[GITHUB](https://github.com/QCoQCo/LogBook)

</div>
