# logBook JSON 목업 데이터 연결 구조

`logBook/public/data/` 아래의 JSON 파일들이 앱 내에서 어떻게 로드·사용되는지 정리한 문서입니다.

---

## 1. 요약

| JSON 파일 | 로드 위치 | 사용 목적 |
|-----------|-----------|-----------|
| `initData.json` | PostContext, PostDetail | 게시글 목록·상세 (피드, 블로그 탭, 에디터) |
| `userData.json` | UserDataContext, Login | 사용자 목록·프로필·로그인(목업) |
| `blogData.json` | BlogGridLayout | 블로그 그리드 레이아웃·요소 (userId별) |
| `blogDroppablesData.json` | BlogFloatingUi | 블로그 편집 시 드래그 가능한 블록 목록 |
| `chatRoomData.json` | chatService | Firebase 채팅방 초기 시드·백업용 목록 |
| `playlistData.json` | PlaylistContext, UserPlayList | 플레이리스트(서버 목업 + localStorage 병합) |
| `postData.json` | **미사용** | 코드에서 참조 없음 |

---

## 2. 파일별 연결 흐름

### 2.1 initData.json

**경로:** `public/data/initData.json`  
**형식:** 게시글 객체 배열 (`postId`, `userId`, `title`, `content`, `createdAt`, `updateAt`, `thumbnail`, `tags` 등)

| 연결 위치 | 방식 | 역할 |
|-----------|------|------|
| **PostContext** (`context/PostContext.jsx`) | `fetch('/data/initData.json')` → `setPosts(data)` | 앱 마운트 시 한 번 로드해 전역 `posts` 상태로 보관 |
| **PostDetail** (`components/pages/PostDetail.jsx`) | `axios.get('/data/initData.json')` | 상세 페이지에서 해당 `postId` 게시글 조회 시 직접 fetch |
| **FeedPage, BlogPosts, PostEditor** 등 | `usePost()` → `posts` | PostContext의 `posts`만 사용 (직접 fetch 없음) |

**데이터 흐름:**  
`initData.json` → PostContext(`posts`) → FeedPage(피드 목록), BlogPosts(블로그 탭 게시글), PostEditor(수정 시 기존 글 로드)  
PostDetail만 별도로 같은 JSON을 다시 fetch해 현재 글만 사용.

---

### 2.2 userData.json

**경로:** `public/data/userData.json`  
**형식:** 사용자 배열 (`userId`, `password`, `nickName`, `userEmail`, `profilePhoto`, `introduction` 등)

| 연결 위치 | 방식 | 역할 |
|-----------|------|------|
| **UserDataContext** (`context/UserDataContext.jsx`) | `fetch('/data/userData.json')` → `setUserData(users)` | 전역 사용자 목록 로드, `getUserInfo(userId)`, `getUserProfilePhoto()` 등 제공 |
| **Login** (`components/common/Login.jsx`) | `fetch('/data/userData.json')` | 1) 목업 로그인: 파일에서 `userId`/`password` 일치 시 로그인 처리 2) Firebase/로컬 로그인 후 프로필 없을 때 프로필 정보 보충용으로 재요청 |

**데이터 흐름:**  
UserDataContext가 로드한 `userData` → Header, BlogUserInfo, ChatMessage, PostDetail 등에서 `useUserData()`로 프로필/닉네임/사진 조회.  
Login은 로그인 시점에만 동일 JSON을 직접 fetch.

---

### 2.3 blogData.json

**경로:** `public/data/blogData.json`  
**형식:** `{ "blogData": [ { "id", "userId", "layout", "elements" }, ... ] }` — React Grid Layout용 `layout`·`elements` per user

| 연결 위치 | 방식 | 역할 |
|-----------|------|------|
| **BlogGridLayout** (`components/blog/BlogGridLayout.jsx`) | `axios.get('/data/blogData.json')` | 쿼리 파라미터 등으로 받은 `userId`에 해당하는 항목의 `layout`, `elements`를 BlogContext의 `setLayout`, `setElements`로 설정 |

**데이터 흐름:**  
`blogData.json` → BlogGridLayout에서 `userId`로 필터 → BlogContext(`layout`, `elements`) → Blog 페이지 그리드·레이아웃 표시.

---

### 2.4 blogDroppablesData.json

**경로:** `public/data/blogDroppablesData.json`  
**형식:** 드롭 가능 블록 배열 (`id`, `className`, `imageSource`, `tooltip`, `w`, `h` 등)

| 연결 위치 | 방식 | 역할 |
|-----------|------|------|
| **BlogFloatingUi** (`components/blog/BlogFloatingUi.jsx`) | `axios('/data/blogDroppablesData.json')` → `setDroppables(response.data)` | 블로그 편집 시 사용할 수 있는 블록 종류(제목, 게시글, 링크, 이미지, 지도 등) 목록 로드 |

**데이터 흐름:**  
`blogDroppablesData.json` → BlogFloatingUi → 각 항목을 BlogDroppable로 렌더링 → 드래그 시 BlogGridLayout 그리드에 드롭.

---

### 2.5 chatRoomData.json

**경로:** `public/data/chatRoomData.json`  
**형식:** `{ "chatRooms": [ { "id", "name", "admin", "userId", "description", ... }, ... ] }`

| 연결 위치 | 방식 | 역할 |
|-----------|------|------|
| **chatService** (`utils/chatService.js`) | `fetch('/data/chatRoomData.json')` | 1) **initializeDefaultChatRooms**: Firestore에 채팅방이 하나도 없을 때 JSON의 `chatRooms`를 시스템 채팅방으로 Firestore에 시드 2) **getChatRoomList**: 채팅방 목록을 JSON에서 가져오는 함수(주석상 “백업용 - 더 이상 사용하지 않음”) |

**데이터 흐름:**  
실제 채팅은 Firestore 기준. 앱 첫 사용 시 Firestore가 비어 있으면 `chatRoomData.json`으로 기본 채팅방만 초기화하는 데 사용.

---

### 2.6 playlistData.json

**경로:** `public/data/playlistData.json`  
**형식:** 플레이리스트 배열 (`userId`, `playId`, `title`, `description`, `songs[]` 등)

| 연결 위치 | 방식 | 역할 |
|-----------|------|------|
| **PlaylistContext** (`context/PlaylistContext.jsx`) | `fetch('/data/playlistData.json')` | `fetchPlaylists(userId)` 호출 시, 해당 `userId`의 플레이리스트만 필터한 뒤 localStorage 플레이리스트와 병합해 캐시·상태 관리 |
| **UserPlayList** (`components/chat/UserPlayList.jsx`) | `fetch('/data/playlistData.json')` | 채팅 등에서 사용자 플레이리스트 목록을 표시할 때 직접 fetch (Context와 별도) |

**데이터 흐름:**  
JSON은 “서버 목업” 역할. PlaylistContext는 JSON + localStorage를 합쳐서 단일 소스처럼 사용하고, UserPlayList는 같은 JSON을 직접 읽어 UI에 사용.

---

### 2.7 postData.json

**경로:** `public/data/postData.json`  
**상태:** **현재 코드베이스에서 참조 없음.**  
게시글 데이터는 전부 `initData.json`으로만 로드되므로, 추후 API 연동 시 스키마 참고용으로 두었거나 미사용 파일일 수 있음.

---

## 3. 로드 시점 정리

| 데이터 | 최초 로드 시점 |
|--------|----------------|
| initData | PostProvider 마운트 시 (앱 진입 시) |
| userData | UserDataProvider 하위에서 `loadUserData()` 호출 시 (필요 시 한 번) |
| blogData | 블로그 페이지에서 BlogGridLayout이 해당 userId로 마운트될 때 |
| blogDroppablesData | 블로그 페이지에서 BlogFloatingUi 마운트 시 |
| chatRoomData | 채팅 관련 초기화 시 Firestore가 비어 있을 때만 (시드용) |
| playlistData | 플레이리스트 조회 시(PlaylistContext `fetchPlaylists`) 또는 UserPlayList 마운트 시 |

---

## 4. 경로 규칙

- 모든 JSON은 **`/data/파일명.json`** 형태로 요청합니다.
- Vite 빌드 시 `public/`이 루트로 서빙되므로 `public/data/xxx.json` → 실제 요청 경로는 `/data/xxx.json`입니다.
- `fetch()` 또는 `axios.get()`으로 가져오며, 서버 API가 없어도 `npm run dev` / 빌드 결과물에서 정적 파일로 응답합니다.

---

*이 문서는 현재 코드 기준으로 작성되었으며, 추후 Spring 등 백엔드 API 연동 시 위 경로들이 API 호출로 대체될 수 있습니다.*
