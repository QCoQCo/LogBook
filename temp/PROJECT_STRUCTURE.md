# LogBook 프로젝트 구조

> 해적의 항해일지 - 자유로운 소셜 블로그 플랫폼  
> **상태: 미완성** (프론트엔드 우선 구현, 백엔드(Spring) 추가·연동 진행 중)

---

## 1. 전체 구조 요약

```
PJ02/
├── logBook/          # 프론트엔드 (React + Vite)
├── spring/           # 백엔드 (Spring Boot) — 추가·연동 중
├── temp/             # 임시/참고 문서
└── .gitignore
```

- **logBook**: SPA 프론트엔드. Firebase(인증·채팅 등) 사용, 추후 Spring API 연동 예정.
- **spring**: 개발자용 블로그 서비스 백엔드. MySQL, JPA, Security, OAuth2, SFTP 등 구성 중.

---

## 2. logBook (프론트엔드)

### 2.1 기술 스택

| 구분        | 기술                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| 런타임/빌드 | Node.js, Vite 7.x                                                      |
| UI          | React 19.x, React Router 7.x                                           |
| 스타일      | SCSS (Sass)                                                            |
| BaaS/실시간 | Firebase (Auth, Firestore 등)                                          |
| HTTP        | Axios                                                                  |
| 기타        | react-grid-layout, react-markdown, Swiper, react-syntax-highlighter 등 |

### 2.2 디렉터리 구조

```
logBook/
├── public/                 # 정적 자산
│   ├── data/               # JSON 목업 데이터
│   │   ├── blogData.json
│   │   ├── blogDroppablesData.json
│   │   ├── chatRoomData.json
│   │   ├── initData.json
│   │   ├── playlistData.json
│   │   ├── postData.json
│   │   └── userData.json
│   ├── html/               # 팝업용 HTML
│   │   └── playerPopup.html
│   ├── img/                # 이미지·아이콘
│   └── video/              # 데모/소개 영상
├── src/
│   ├── components/
│   │   ├── blog/           # 블로그 그리드·레이아웃·플레이리스트 등
│   │   │   ├── BlogDroppable.jsx
│   │   │   ├── BlogElementModal.jsx
│   │   │   ├── BlogFloatingUi.jsx
│   │   │   ├── BlogGridLayout.jsx
│   │   │   ├── BlogLayoutItem.jsx
│   │   │   ├── BlogPlaylist.jsx, BlogPlaylistItem.jsx
│   │   │   ├── BlogPosts.jsx, BlogUserInfo.jsx
│   │   │   └── index.js
│   │   ├── chat/           # 채팅방·메시지·모달
│   │   │   ├── ChatMessage.jsx, ChatRoomList.jsx
│   │   │   ├── ChatRoomUsersModal.jsx, CreateChatRoomModal.jsx
│   │   │   ├── PasswordModal.jsx, UserInfoModal.jsx
│   │   │   ├── UserPlayList.jsx
│   │   │   └── index.js
│   │   ├── common/         # 공통 UI·레이아웃
│   │   │   ├── FloatingButton, Footer, Header
│   │   │   ├── Login.jsx, SwiperFeatureControls.jsx
│   │   │   └── index.js
│   │   ├── pages/          # 페이지 컴포넌트
│   │   │   ├── Blog, ChatPage, ErrorPage, FeedPage
│   │   │   ├── LogBookIntro, Playlist, PlaylistItem
│   │   │   ├── PostDetail, PostEdit, SignUp
│   │   │   └── index.js
│   │   └── post/           # 게시글 상세·편집·뷰어
│   │       ├── PostDetailHeader, PostDetailProfile
│   │       ├── PostEditor, PostEditorModal, PostPreview
│   │       ├── PostStickyUtils, PostToolbar, PostViewer
│   │       └── index.js
│   ├── context/            # React Context (전역 상태)
│   │   ├── AuthContext, UserDataContext, UIContext
│   │   ├── ChatContext, BlogContext, PostContext
│   │   ├── PlaylistContext, YTPopupContext
│   │   └── index.js
│   ├── firebase/           # Firebase 설정
│   │   └── config.js
│   ├── routes/
│   │   ├── index.js
│   │   └── PostRoutes.jsx   # 게시글 관련 라우트
│   ├── utils/
│   │   ├── animations.css
│   │   ├── auth.js
│   │   ├── chatService.js
│   │   └── sessionSync.js
│   ├── App.jsx, App.css
│   ├── main.jsx
│   └── index.css
├── db_data/
│   └── erd.erd              # ERD 설계 파일
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

### 2.3 주요 라우트 (참고)

- `/` — 로그북 소개(LogBookIntro)
- `/chat` — 채팅(ChatPage)
- `/playlist/:playId` — 플레이리스트
- `/blog` — 블로그 편집/보기
- `/signUp` — 회원가입
- 게시글 관련 — `PostRoutes.jsx`에서 상세/편집 등 처리

### 2.4 Context 역할 (간단)

- **AuthContext**: 로그인/로그아웃 상태
- **UserDataContext**: 사용자 정보
- **ChatContext / BlogContext / PostContext**: 채팅, 블로그, 게시글 상태
- **PlaylistContext / YTPopupContext**: 플레이리스트·YouTube 팝업
- **UIContext**: UI 전역 상태

---

## 3. spring (백엔드)

### 3.1 기술 스택

| 구분        | 기술                                         |
| ----------- | -------------------------------------------- |
| 언어/런타임 | Java 21                                      |
| 프레임워크  | Spring Boot 4.x                              |
| DB          | MySQL, Spring Data JPA (Hibernate)           |
| 보안        | Spring Security, OAuth2 Authorization Server |
| 기타        | Lombok, JSch(SFTP), Gradle                   |

### 3.2 디렉터리 구조

```
spring/
├── src/
│   ├── main/
│   │   ├── java/com/skull/logbook/
│   │   │   ├── LogbookApplication.java
│   │   │   └── entity/
│   │   │       └── posts.java      # 게시글 엔티티 (기본 구성)
│   │   └── resources/
│   │       ├── application.yaml    # DB, JPA, SFTP 등 설정
│   │       └── data.sql            # 초기 데이터 (선택)
│   └── test/
│       └── java/com/skull/logbook/
│           └── LogbookApplicationTests.java
├── gradle/
│   └── wrapper/
├── build.gradle
├── settings.gradle
├── gradlew, gradlew.bat
└── HELP.md
```

### 3.3 설정 요약 (application.yaml)

- **DB**: MySQL (`db.host`, `db.port`, `db.name`, `db.username`, `db.password` — 보통 `.env` 또는 환경변수)
- **JPA**: `ddl-auto: create`, MySQL 방언, DDL 표기법 등
- **서버**: 포트 `8080`
- **파일 업로드**: SFTP (`sftp.host`, `sftp.port`, `sftp.username`, `sftp.password`, `sftp.uploadPath`)

`bootRun` / `test` 시 프로젝트 루트의 `.env` 파일을 읽어 시스템 프로퍼티로 주입하도록 `build.gradle`에 설정됨.

### 3.4 엔티티 (현재)

- **posts**: `id`, `userId`, `title`, `content`, `createdAt`, `updatedAt`, `deletedAt`  
  → 프론트의 게시글(Post) 기능과 연동 예정.

---

## 4. 연동·미완성 부분 (참고)

- 프론트는 아직 주로 **Firebase + public/data JSON** 기준으로 동작.
- **Spring API 연동**(게시글 CRUD, 사용자, 파일 업로드 등)은 추가·수정 예정.
- 백엔드: 엔티티·API·Security·OAuth2·SFTP 연동 등 세부 구현 진행 중.
- `logBook/README.md`에 “백엔드 추가 예정” 명시됨.

---

## 5. 실행 방법 (참고)

- **프론트**: `logBook` 디렉터리에서 `npm install` 후 `npm run dev` (기본 포트 예: 5173).
- **백엔드**: `spring` 디렉터리에서 `./gradlew bootRun` (MySQL·SFTP 등은 `.env`/환경변수 필요).

---

_이 문서는 프로젝트가 미완성인 상태를 기준으로 작성된 참고용 구조 설명입니다._
