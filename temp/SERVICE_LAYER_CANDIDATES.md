# logBook — 서비스 레이어로 옮겨야 할 부분 목록

Context/컴포넌트에 있는 **데이터 fetching**과 **도메인·비즈니스 로직** 중 서비스 레이어(`src/services/` 등)로 분리하는 것이 좋은 항목을 정리했습니다.

---

## 1. 요약

| 구분 | 위치 | 옮길 내용 | 제안 서비스 |
|------|------|-----------|-------------|
| Fetch | PostContext | initData.json 로드 | `postService` |
| Fetch | UserDataContext | userData.json 로드 | `userService` |
| Fetch + 로직 | PlaylistContext | playlistData fetch + localStorage 병합·dedupe | `playlistService` |
| Fetch | PostDetail | initData.json + postId로 게시글 조회 | `postService` |
| Fetch + 로직 | Login | userData.json으로 목업 로그인·프로필 보충 | `userService` / `authService` |
| Fetch | UserPlayList | playlistData.json + userId 필터 | `playlistService` |
| Fetch + 로직 | BlogGridLayout | blogData.json + userId로 layout/elements 추출 | `blogService` |
| Fetch | BlogFloatingUi | blogDroppablesData.json 로드 | `blogService` |
| Fetch | chatService (utils) | chatRoomData.json (시드·백업) | 유지 또는 `chatRoomService` |
| Fetch + 로직 | Playlist (페이지) | YouTube oEmbed 메타 조회 | `youtubeService` / `embedService` |

---

## 2. 파일·라인별 상세

### 2.1 PostContext.jsx

- **위치:** `src/context/PostContext.jsx` (약 12~24라인)
- **현재:** `fetch('/data/initData.json')` 후 `setPosts(data)`를 Context 내부에서 수행
- **옮길 것:** 게시글 목록 조회 API 호출
- **제안:** `postService.getPosts()` 또는 `postService.fetchPosts()`  
  - 반환: `Promise<Array>` (게시글 배열)  
  - Context는 `postService.getPosts().then(setPosts)` 만 호출

---

### 2.2 UserDataContext.jsx

- **위치:** `src/context/UserDataContext.jsx` (약 17~34라인)
- **현재:** `fetch('/data/userData.json')` 후 `setUserData(users)`를 Context 내부에서 수행
- **옮길 것:** 사용자 목록 조회
- **제안:** `userService.getUsers()` 또는 `userService.fetchUserData()`  
  - 반환: `Promise<Array>` (사용자 배열)  
  - Context는 호출 결과만 받아 `setUserData`에 넣음  
- **참고:** `isGuestUser`, `userDataMap`, `getUserProfilePhoto`, `getUserInfo` 등 **조회/파생 로직**은 Context에 두거나, 재사용이 많으면 `userService`의 순수 함수로 분리 가능

---

### 2.3 PlaylistContext.jsx

- **위치:** `src/context/PlaylistContext.jsx` (약 12~74라인)
- **현재:**
  - `fetch('/data/playlistData.json')` 로 서버(목업) 플레이리스트 조회
  - `localStorage`에서 같은 userId 키로 로컬 플레이리스트 읽기
  - 서버·로컬 병합 및 `contentId` 기준 songs dedupe 로직을 Context 안에 보유
- **옮길 것:**
  1. **데이터 소스 조회:** 플레이리스트 원본 조회 (서버 목업 + localStorage 읽기)
  2. **병합·비즈니스 로직:** 같은 playId 기준 병합, songs dedupe
- **제안:** `playlistService.fetchPlaylistsForUser(userId)`  
  - 내부에서 `/data/playlistData.json` fetch + `localStorage` 읽기 + 병합·dedupe 수행  
  - 반환: `Promise<Array>` (병합된 플레이리스트 배열)  
  - Context는 이 결과만 받아 `setPlaylistsByUser` 등에 반영  
- **추가:** `persistUserPlaylists(userId, lists)`에 해당하는 localStorage 저장도 `playlistService.persistPlaylists(userId, lists)` 등으로 서비스로 옮기면 일관됨

---

### 2.4 PostDetail.jsx

- **위치:** `src/components/pages/PostDetail.jsx` (약 58~78라인)
- **현재:** `axios.get('/data/initData.json')` 후 `res.data.find((p) => p.postId === postId)`로 단일 게시글 추출, `userData`로 소유자 매칭
- **옮길 것:**
  1. 게시글 단건 조회 (또는 목록 조회 후 postId 필터)
  2. (선택) 소유자 정보 결합 로직
- **제안:** `postService.getPostById(postId)`  
  - 반환: `Promise<{ post, owner } | null>` 또는 `Promise<post>`  
  - 소유자 매칭은 서비스에서 하거나, 컴포넌트에서 `useUserData()`로만 처리할지 결정  
- **효과:** PostContext의 `posts`와 PostDetail의 직접 fetch가 같은 소스(initData)를 쓰므로, 나중에 API로 바꿀 때 `postService` 한 곳만 수정하면 됨

---

### 2.5 Login.jsx

- **위치:** `src/components/common/Login.jsx` (약 38~100라인)
- **현재:**
  1. `fetch('/data/userData.json')` → `userId`/`password` 일치 시 목업 로그인
  2. 실패 시 `loginClient(userId, password)` (utils/auth)
  3. 로그인 성공 후 프로필 부족하면 다시 `fetch('/data/userData.json')`로 프로필 보충
- **옮길 것:**
  1. 목업 사용자 검증 및 프로필 반환
  2. (선택) “목업 먼저 → 로컬 로그인 → 프로필 보충” 전체 플로우
- **제안:**
  - `userService.getUsers()`: UserDataContext와 동일한 소스 호출로 통일
  - `authService.loginWithMockOrLocal(userId, password)` 또는  
    `userService.validateMockUser(userId, password)` + 실패 시 기존 `loginClient`  
  - 프로필 보충: `userService.getUserById(userId)` 등으로 한 번만 조회하도록 정리  
- **효과:** Login에서 fetch 2회 제거, 로그인 플로우가 서비스 레이어에 모여서 테스트·교체가 쉬움

---

### 2.6 UserPlayList.jsx (채팅 쪽 플레이리스트)

- **위치:** `src/components/chat/UserPlayList.jsx` (약 23~46라인)
- **현재:** `fetch('/data/playlistData.json')` 후 `userId`로 필터해 `setPlaylistData`
- **옮길 것:** 사용자별 플레이리스트 목록 조회
- **제안:** `playlistService.getPlaylistsByUser(userId)` 또는  
  `playlistService.fetchPlaylists(userId)` (PlaylistContext와 동일한 서비스 사용 권장)  
  - 반환: `Promise<Array>`  
  - 로그인 여부에 따른 “전체 vs 내 것만” 필터는 서비스 인자 또는 호출부에서 처리

---

### 2.7 BlogGridLayout.jsx

- **위치:** `src/components/blog/BlogGridLayout.jsx` (약 15~37라인)
- **현재:** `axios.get('/data/blogData.json')` → `response.data.blogData`에서 `userId`로 항목 찾기 → `layout`, `elements` 추출 및 layout id에서 숫자 파싱 (`parseInt(item.i.split('-')[1])`)
- **옮길 것:**
  1. blogData.json 조회
  2. userId별 layout/elements 추출 및 id 파싱 로직
- **제안:** `blogService.getBlogLayoutByUserId(userId)`  
  - 반환: `Promise<{ layout, elements, nextItemCounter }>` 또는 `{ layout, elements }`  
  - 컴포넌트는 이 결과로 `setLayout`, `setElements`, `setNewItemCounter`만 호출

---

### 2.8 BlogFloatingUi.jsx

- **위치:** `src/components/blog/BlogFloatingUi.jsx` (약 11~18라인)
- **현재:** `axios('/data/blogDroppablesData.json')` → `setDroppables(response.data)`
- **옮길 것:** 드롭 가능 블록 목록 조회
- **제안:** `blogService.getDroppableItems()`  
  - 반환: `Promise<Array>`  
  - BlogFloatingUi는 서비스 결과만 state에 넣어 렌더

---

### 2.9 chatService.js (utils)

- **위치:** `src/utils/chatService.js` (약 201~203, 231~236라인)
- **현재:**  
  - `initializeDefaultChatRooms`: Firestore 비어 있을 때 `fetch('/data/chatRoomData.json')`로 시드  
  - `getChatRoomList`: `fetch('/data/chatRoomData.json')`로 채팅방 목록 반환 (백업용)
- **옮길 것:**  
  - JSON 경로 및 fetch 자체를 “채팅방 목업/시드 전용” 서비스로 명확히 구분할 수 있음
- **제안:**  
  - **옵션 A:** 그대로 두고, 나중에 API가 생기면 `chatService` 내부에서 `/data/` 대신 API 호출로 교체  
  - **옵션 B:** `chatRoomSeedService.getDefaultChatRooms()` 같은 함수로 빼서 `chatService`는 Firestore + 이 시드 서비스만 사용  
- **공통:** 채팅 도메인은 이미 `utils/chatService.js`에 모여 있으므로, “서비스 레이어로 옮긴다”기보다 “목업 데이터 조회만 작은 함수/모듈로 분리”해도 됨

---

### 2.10 Playlist.jsx (페이지) — YouTube oEmbed

- **위치:** `src/components/pages/Playlist.jsx` (약 143~171라인 부근)
- **현재:** YouTube URL에서 video id 추출 후 `fetch(\`https://www.youtube.com/oembed?url=...\`)` 로 제목·썸네일 조회
- **옮길 것:** YouTube 메타데이터(oEmbed) 조회
- **제안:** `youtubeService.fetchVideoMetadata(videoUrl)` 또는 `embedService.getOEmbed(url)`  
  - 인자: video URL 또는 video id  
  - 반환: `Promise<{ title, thumbnail_url }>` 등  
  - Playlist.jsx는 이 결과로 `setTitle`, `setThumbnail`만 수행  
- **효과:** 외부 API 호출·에러 처리·URL 생성이 한 곳에 모이고, 테스트/목업이 쉬움

---

## 3. Context에 두되 서비스와 역할 나누기

- **Context:** 상태 보관 + `useEffect`/이벤트에서 **서비스 함수 호출** + 결과를 `setState`  
- **Service:**  
  - `fetch` / `axios` 호출  
  - localStorage 읽기·쓰기  
  - 배열 병합, dedupe, id 파싱 등 **도메인·비즈니스 로직**  
  - 반환만 하고 상태는 모름  

이렇게 나누면:

- API base URL·목업 경로 변경은 서비스만 수정하면 됨  
- Context/컴포넌트는 “어디서 데이터를 가져오는지” 몰라도 됨  
- 서비스 단위 테스트 작성이 쉬움  

---

## 4. 제안 서비스 파일 구조 (참고)

```
src/
  services/
    postService.js      # getPosts(), getPostById(postId)
    userService.js      # getUsers(), getUserById(userId)
    playlistService.js  # fetchPlaylistsForUser(userId), persistPlaylists(userId, lists)
    blogService.js      # getBlogLayoutByUserId(userId), getDroppableItems()
    youtubeService.js   # fetchVideoMetadata(videoUrl)
  utils/
    auth.js             # 기존 (loginClient, signupClient 등)
    chatService.js      # 기존 (Firestore + chatRoomData 시드/백업)
```

---

## 5. 우선순위 제안

1. **중복 제거·일관성:** `postService`, `userService`, `blogService`  
   - PostContext / PostDetail / UserDataContext / Login / BlogGridLayout / BlogFloatingUi의 fetch를 서비스로 이전  
2. **비즈니스 로직 분리:** `playlistService`  
   - PlaylistContext의 fetch + 병합·dedupe + persist  
3. **외부 API 분리:** `youtubeService` (또는 `embedService`)  
   - Playlist 페이지의 oEmbed 호출  
4. **정리:** chatService 내부의 chatRoomData fetch는 필요 시 작은 시드 전용 함수로만 분리  

이 순서로 적용하면, 나중에 Spring 등 백엔드 API로 바꿀 때 각 서비스 파일만 수정하면 됩니다.
