-- posts
INSERT IGNORE INTO posts (id, userId, title, content, createdAt, updatedAt, deletedAt) VALUES
(1, 2, '더 이상 혼자 고민하지 마세요! 2025년 개인 개발의 파트너 도구 모음', '## 더 이상 혼자 고민하지 마세요! 2025년 개인 개발의 파트너 도구 모음\n\n![포스트 썸네일](https://picsum.photos/seed/1/600/360)\n\n> **서론**\n>\n> 최근 개인 개발 프로젝트를 진행하면서 깊이 느낀 점이 있는데, "적절한 도구 선택"이 정말 중요하다는 것입니다. 특히 AI 시대인 지금, 도구 하나의 선택으로 개발 속도가 2배, 3배로 달라질 수 있습니다. 저 자신도 작년까지는 "코드만 작성할 수 있으면 OK"라고 생각했지만, 어느 날 선배 엔지니어에게 "이런 방식으로는 시간이 아깝다"라는 말을 듣고 눈을 떴습니다. 그래서 이번에는 제가 실제로 사용해보고 "이것은 정말 대단하다!"라고 느낀 2025년 버전의 개인 개발 도구를 엄선해서 소개해 드리겠습니다. 모두 실제 개발 현장에서 사용할 수 있는 것들이니 참고해 보세요.\n\n---\n\n### 1. 코드 작성\n\n- **VS Code**\n- **JetBrains IDEs**\n\n```javascript\n// 예시 코드 블록\nfunction sum(a, b) {\n  return a + b;\n}\n\nconsole.log(sum(1, 2)); // 3\n```\n\n---\n\n### 2. 버전 관리\n\n- **Git**\n- **GitHub**\n- **GitLab**\n\n---\n\n### 3. 프로젝트 관리\n\n- **Notion**\n- **Trello**\n\n---\n\n### 4. 배포\n\n- **Vercel**\n- **Netlify**\n\n---\n\n> **결론**\n>\n> 이 외에도 많은 훌륭한 도구들이 있지만, 저는 위 도구들을 통해 개인 개발 효율을 크게 높일 수 있었습니다. 이 글이 여러분의 개발 여정에도 도움이 되기를 바랍니다. 궁금한 점이 있다면 댓글로 남겨주세요!', '2025-08-01 12:00:00', '2025-08-01 12:00:00', NULL),
(2, -1, '[ERROR CASE] 에러페이지 테스트', '클릭 시 에러가 발생합니다.', '2025-07-20 09:30:00', '2025-07-20 09:30:00', NULL),
(3, 2, 'React 성능 최적화: 렌더링 병목 찾는 5가지 방법', 'React 앱의 성능 문제를 해결하려면 우선 병목을 정확히 측정해야 합니다. 프로파일링, 메모이제이션, 레이지 로딩, 리스트 가상화, 불필요한 상태 끌어올리기 등 실무에서 자주 쓰는 패턴을 실제 사례와 함께 정리했습니다.\n\n![React 성능 최적화 이미지](https://picsum.photos/seed/3/600/360)', '2025-06-15 15:45:00', '2025-06-16 08:00:00', NULL),
(4, 0, '작은 팀을 위한 깔끔한 코드 리뷰 규칙', '코드 리뷰는 품질을 높이는 가장 강력한 도구입니다. 다만 리뷰 문화가 없거나 기준이 없으면 사소한 논쟁이 늘어나 생산성이 떨어집니다. 이 글에서는 작은 팀에서 적용하기 좋은 7가지 규칙을 제안합니다: 목적 정의, PR 크기 제한, 자동화 도구 활용, 긍정적 피드백 우선 등.\n\n![코드 리뷰 이미지](https://picsum.photos/seed/4/600/360)', '2025-05-10 11:00:00', '2025-05-10 11:00:00', NULL),
(5, 3, '개발자를 위한 생산성 도구: 네이티브 앱 vs 웹 앱', '생산성 도구를 선택할 때 데스크탑 네이티브 앱과 웹 앱 사이에서 고민하는 경우가 많습니다. 이 글에서는 각각의 장단점, 오프라인 지원, 동기화 전략, 배포 편의성 등을 비교하고, 개인 개발 환경에 맞는 추천 설정을 제시합니다.\n\n![생산성 도구 이미지](https://picsum.photos/seed/5/600/360)', '2025-04-01 08:00:00', '2025-04-01 08:00:00', NULL),
(6, 2, '모던 자바스크립트 모듈 시스템 정리', 'ESM과 CommonJS의 차이, 번들링 이후의 모듈 로딩 전략, dynamic import와 트리 쉐이킹을 활용한 번들 최적화 방법을 정리합니다.\n\n![자바스크립트 모듈 이미지](https://picsum.photos/seed/6/600/360)', '2025-03-22 10:15:00', '2025-03-22 10:15:00', NULL),
(7, 1, 'CSS-in-JS vs 전통적 CSS: 언제 어떤걸 선택할까', '스타일링 전략은 유지보수성과 성능에 큰 영향을 줍니다. 컴포넌트 기반 개발에서의 장단점과 실무 적용 팁을 사례와 함께 소개합니다.\n\n![CSS-in-JS 이미지](https://picsum.photos/seed/7/600/360)', '2025-02-14 14:00:00', '2025-02-14 14:00:00', NULL),
(8, 4, '간단한 서버리스 API 설계 가이드', '서버리스 환경에서 API를 설계할 때 주의할 점: 인증, 비용 최적화, cold start 완화, 로깅과 모니터링을 중심으로 실무 팁을 정리합니다.\n\n![서버리스 API 이미지](https://picsum.photos/seed/8/600/360)', '2025-01-30 09:00:00', '2025-01-30 09:00:00', NULL),
(9, 2, '작업흐름 자동화: GitHub Actions로 시작하기', 'CI/CD를 처음 도입하는 팀을 위해 GitHub Actions 기반의 간단한 워크플로 작성법, 보안, 그리고 배포 전략을 단계별로 안내합니다.\n\n![GitHub Actions 이미지](https://picsum.photos/seed/9/600/360)', '2025-01-10 16:20:00', '2025-01-10 16:20:00', NULL),
(10, 2, 'TypeScript로 안전하게 대규모 리팩터링하기', 'TypeScript의 타입 시스템을 활용해 리팩터링 범위를 안전하게 넓히는 방법, 점진적 마이그레이션 전략과 유용한 타입 유틸리티를 설명합니다.\n\n![TypeScript 리팩터링 이미지](https://picsum.photos/seed/10/600/360)', '2024-12-05 13:00:00', '2024-12-05 13:00:00', NULL),
(11, 3, '서비스 운영에서 학습한 로깅과 트러블슈팅 요령', '인시던트 대응 경험을 바탕으로 로그 수집, 지표 설계, 빠른 원인 파악을 위한 체크리스트와 실무 예시를 공유합니다.\n\n![로깅과 트러블슈팅 이미지](https://picsum.photos/seed/11/600/360)', '2024-11-18 10:00:00', '2024-11-18 10:00:00', NULL),
(12, 1, '웹 접근성(Accessibility) 기본 체크리스트', '접근성은 모두를 위한 기능입니다. 마크업/ARIA/키보드 네비게이션/컬러 대비 등의 기본 체크리스트와 자동화 툴 사용법을 정리합니다.\n\n![웹 접근성 이미지](https://picsum.photos/seed/12/600/360)', '2024-10-30 09:45:00', '2024-10-30 09:45:00', NULL),
(13, 4, '경량화된 이미지 최적화 전략', '이미지 형식 선택(AVIF/WebP/PNG), 레이지 로딩, CDN 활용, 빌드 타임 변환에 대한 실전 팁을 설명합니다.\n\n![이미지 최적화 이미지](https://picsum.photos/seed/13/600/360)', '2024-09-12 12:00:00', '2024-09-12 12:00:00', NULL),
(14, 0, '소규모 서비스에서의 데이터베이스 선택 가이드', '관계형 DB와 NoSQL의 장단점을 소규모 서비스 관점에서 정리하고, 마이그레이션 고려사항과 운영 팁을 제공합니다.\n\n![데이터베이스 선택 이미지](https://picsum.photos/seed/14/600/360)', '2024-08-05 11:30:00', '2024-08-05 11:30:00', NULL),
(15, 2, '효율적인 에러 핸들링 패턴 모음', '프론트엔드와 백엔드 각각에서 사용할 수 있는 에러 핸들링 패턴을 사례별로 정리하고, 공통적으로 적용 가능한 모범 사례를 제안합니다.\n\n![에러 핸들링 이미지](https://picsum.photos/seed/15/600/360)', '2024-07-01 07:00:00', '2024-07-01 07:00:00', NULL),
(16, 4, '모바일 퍼포먼스 튜닝: 렌더링 최적화 체크리스트', '모바일 환경에서 렌더링 성능을 개선하기 위한 실전 체크리스트와 사례를 정리했습니다. 레이아웃 스래싱, 레이지로딩, 이미지 최적화 중심.\n\n![모바일 퍼포먼스 이미지](https://picsum.photos/seed/16/600/360)', '2024-06-20 10:00:00', '2024-06-20 10:00:00', NULL),
(17, 1, 'Docker로 로컬 개발환경 통일하기', '개발팀이 동일한 환경에서 작업하도록 Docker를 도입할 때 고려할 설정, 권장 베이스 이미지, 그리고 도구들을 정리했습니다.\n\n![Docker 이미지](https://picsum.photos/seed/17/600/360)', '2024-06-01 09:00:00', '2024-06-01 09:00:00', NULL),
(18, 3, '작업 우선순위 정하기: RICE와 MoSCoW 비교', '프로덕트 개발에서 기능 우선순위를 정할 때 사용하는 프레임워크를 비교하고, 작은 팀에서 적용하는 방법을 사례와 함께 설명합니다.\n\n![작업 우선순위 이미지](https://picsum.photos/seed/18/600/360)', '2024-05-18 13:30:00', '2024-05-18 13:30:00', NULL),
(19, 0, '간단한 상태 관리 도구 비교: Recoil vs Zustand vs Redux', '프로젝트 규모와 팀에 맞는 상태관리 선택 기준과 각 라이브러리의 장단점을 실무 예제와 함께 설명합니다.\n\n![상태 관리 이미지](https://picsum.photos/seed/19/600/360)', '2024-04-25 11:10:00', '2024-04-25 11:10:00', NULL),
(20, 2, 'GraphQL을 도입할 때 고려할 7가지', 'GraphQL 스키마 설계, 성능, 캐싱, 보안 등 도입 전 체크리스트를 정리했습니다. REST와의 혼용 전략도 다룹니다.\n\n![GraphQL 이미지](https://picsum.photos/seed/20/600/360)', '2024-04-10 08:45:00', '2024-04-10 08:45:00', NULL),
(21, 4, '로컬 개발에서의 비밀 관리: .env와 시크릿 스토어', '개발 환경에서 비밀값을 안전하게 관리하는 방법과 팀 공유 시 주의할 점, 추천 툴을 소개합니다.\n\n![비밀 관리 이미지](https://picsum.photos/seed/21/600/360)', '2024-03-05 12:00:00', '2024-03-05 12:00:00', NULL),
(22, 1, '프로그래밍 학습 로드맵: 6개월 계획 예시', '초보자가 6개월 동안 실무 수준으로 성장하기 위한 학습 로드맵과 주 단위 목표 설정 방법을 제안합니다.\n\n![학습 로드맵 이미지](https://picsum.photos/seed/22/600/360)', '2024-02-20 09:00:00', '2024-02-20 09:00:00', NULL),
(23, 3, '오픈 소스 기여를 시작하는 방법', '처음 오픈 소스에 기여하는 사람들을 위해 이슈 찾기, PR 작성 규칙, 유지보수자와의 커뮤니케이션 팁을 정리했습니다.\n\n![오픈 소스 기여 이미지](https://picsum.photos/seed/23/600/360)', '2024-01-15 10:30:00', '2024-01-15 10:30:00', NULL),
(24, 0, 'SWR과 React-Query 성능 비교', '데이터 페칭 라이브러리를 선택할 때 고려할 점과, SWR과 React-Query의 내부 전략 차이 및 성능 특성을 비교합니다.\n\n![SWR과 React-Query 이미지](https://picsum.photos/seed/24/600/360)', '2023-12-10 14:00:00', '2023-12-10 14:00:00', NULL),
(25, 2, '프로덕트 디자인 기초: 사용자 여정 맵 작성법', '서비스 기획 시 사용자 여정 지도를 작성하는 방법과 인터뷰 기반 개선 포인트 찾기 방법을 설명합니다.\n\n![사용자 여정 맵 이미지](https://picsum.photos/seed/25/600/360)', '2023-11-01 09:00:00', '2023-11-01 09:00:00', NULL),
(26, 4, '간단한 성능 테스트: Lighthouse 활용 가이드', '웹 성능을 측정하기 위해 Lighthouse를 사용하는 방법과 점수 해석, 개선 우선순위를 정하는 방법을 설명합니다.\n\n![Lighthouse 성능 테스트 이미지](https://picsum.photos/seed/26/600/360)', '2023-10-20 08:00:00', '2023-10-20 08:00:00', NULL),
(27, 1, '작은 팀을 위한 회고 문화 만들기', '정기적인 회고를 통해 팀의 개선점을 찾는 방법과 회고에서 피해야 할 실수들을 정리합니다.\n\n![회고 문화 이미지](https://picsum.photos/seed/27/600/360)', '2023-09-15 15:00:00', '2023-09-15 15:00:00', NULL),
(28, 3, '프로덕션에서의 모니터링: 메트릭과 알림 설정', '핵심 메트릭을 정의하고 알림 정책을 설계하는 방법, 그리고 경보의 소음(노이즈) 줄이는 전략을 공유합니다.\n\n![모니터링 이미지](https://picsum.photos/seed/28/600/360)', '2023-08-01 07:30:00', '2023-08-01 07:30:00', NULL),
(29, 0, '빠른 프로토타입을 위한 디자인 툴 비교', 'Figma, Sketch, Adobe XD 등 디자인 툴의 장단점과 빠른 프로토타입 제작 팁을 정리했습니다.\n\n![디자인 툴 비교 이미지](https://picsum.photos/seed/29/600/360)', '2023-07-10 12:00:00', '2023-07-10 12:00:00', NULL),
(30, 2, '대규모 트래픽 대응을 위한 캐시 전략', 'CDN, 애플리케이션 레벨 캐시, DB 캐시 전략을 조합해 대규모 트래픽을 효율적으로 처리하는 방법을 설명합니다.\n\n![캐시 전략 이미지](https://picsum.photos/seed/30/600/360)', '2023-06-01 06:00:00', '2023-06-01 06:00:00', NULL);

-- users
INSERT IGNORE INTO users (id, loginId, password, nickName, userEmail, profilePhoto, introduction, createdAt, updatedAt, deletedAt) VALUES
(0, 'admin', '1234', 'DevAdMin', 'lls1010@gmail.com', NULL, '관리자입니다.', '2025-08-22', '2025-08-25', NULL),
(1, 'musiclover', 'music123', '음악애호가', 'musiclover@example.com', NULL, '클래식과 재즈를 사랑하는 음악 애호가입니다.', '2024-12-01', '2024-12-15', NULL),
(2, 'developer123', 'dev2024', '코딩하는개발자', 'developer@example.com', '/img/profile_dev.jpg', '풀스택 개발자로 새로운 기술에 관심이 많습니다.', '2024-11-15', '2024-12-20', NULL),
(3, 'gameplayer', 'game456', '게임마스터', 'gamer@example.com', NULL, '게임과 음악을 결합한 OST를 좋아합니다.', '2024-10-20', '2024-12-18', NULL),
(4, 'bookworm', 'book789', '독서광', 'bookworm@example.com', NULL, '책을 읽으며 듣는 배경음악을 찾고 있습니다.', '2024-09-10', '2024-12-22', NULL),
(5, 'belldoor', 'wad', '종무니', 'bookworm@example.com', '/img/wad13.jpg', '어 내 종문인데 다 댐벼보거라!', '2024-09-10', '2024-12-22', NULL),
(6, 'susybaka', '1234', 'CO_s_MOS', 'kumityou@example.com', '/img/b2.png', '$KULL조 조장', '2025-08-16', '2025-09-02', NULL),
(7, 'devbhkim0707', '1234', 'baewoolhak', 'bhkim0707@example.com', '/img/bkp.jpeg', '$KULL 최연장자 \n node.js / Spring / Kotlin / Flutter', '2025-08-16', '2025-09-02', NULL),
(8, 'ljh1234', '1234', 'LeeJee', 'ljm@example.com', 'https://image.aladin.co.kr/product/30331/32/cover500/f542839237_1.jpg', '리눅스 마스터', '2025-08-16', '2025-09-02', NULL);

-- Playlist Data
INSERT IGNORE INTO playlist (id, userId, title, createdAt, updatedAt, deletedAt) VALUES
(1, 1, 'My Favorite Songs', NOW(), NOW(), NULL),
(2, 1, 'My Favorite Songs2', NOW(), NOW(), NULL),
(3, 0, 'My Favorite Songs', NOW(), NOW(), NULL),
(4, 6, 'My Favorite Songs1', NOW(), NOW(), NULL),
(5, 6, 'My Favorite Songs2', NOW(), NOW(), NULL),
(6, 2, '힙한척 할때 듣는 플리', NOW(), NOW(), NULL),
(7, 2, '십덕 플리', NOW(), NOW(), NULL);

-- Playlist Item Data
-- Playlist 1 (musiclover: My Favorite Songs)
INSERT IGNORE INTO playlistItem (playId, title, link, thumbnail, seq, createdAt, updatedAt, deletedAt) VALUES
(1, 'Official髭男dism - イエスタデイ［Official Video］', 'https://www.youtube.com/watch?v=DuMqFknYHBs&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=3', 'https://i.ytimg.com/vi/DuMqFknYHBs/hqdefault.jpg', 1, '2023-10-01 12:00:00', NOW(), NULL),
(1, '春を告げる', 'https://www.youtube.com/watch?v=EwpKUV0ECvQ&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=1', 'https://i.ytimg.com/vi/EwpKUV0ECvQ/hqdefault.jpg', 2, '2023-10-02 12:00:00', NOW(), NULL),
(1, 'yama『us』Music Video', 'https://www.youtube.com/watch?v=f8dw0JS3Yrg&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=2', 'https://i.ytimg.com/vi/f8dw0JS3Yrg/hqdefault.jpg', 3, '2023-10-02 12:00:00', NOW(), NULL),
(1, 'Ao To Natsu', 'https://www.youtube.com/watch?v=-QxMzUEJH4Q&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=4', 'https://i.ytimg.com/vi/-QxMzUEJH4Q/hqdefault.jpg', 4, '2023-10-02 12:00:00', NOW(), NULL),
(1, 'Mrs. GREEN APPLE「ライラック」Official Music Video', 'https://www.youtube.com/watch?v=QjrkrVmC-8M&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=5', 'https://i.ytimg.com/vi/QjrkrVmC-8M/hqdefault.jpg', 5, '2023-10-02 12:00:00', NOW(), NULL),
(1, 'Sukidakara', 'https://www.youtube.com/watch?v=SVkGRoLicuA&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=6', 'https://i.ytimg.com/vi/SVkGRoLicuA/hqdefault.jpg', 6, '2023-10-02 12:00:00', NOW(), NULL);

-- Playlist 2 (musiclover: My Favorite Songs2)
INSERT IGNORE INTO playlistItem (playId, title, link, thumbnail, seq, createdAt, updatedAt, deletedAt) VALUES
(2, 'Official髭男dism - イエスタデイ［Official Video］', 'https://www.youtube.com/watch?v=DuMqFknYHBs&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=3', 'https://i.ytimg.com/vi/DuMqFknYHBs/hqdefault.jpg', 1, '2023-10-01 12:00:00', NOW(), NULL),
(2, '春を告げる', 'https://www.youtube.com/watch?v=EwpKUV0ECvQ&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=1', 'https://i.ytimg.com/vi/EwpKUV0ECvQ/hqdefault.jpg', 2, '2023-10-02 12:00:00', NOW(), NULL),
(2, 'yama『us』Music Video', 'https://www.youtube.com/watch?v=f8dw0JS3Yrg&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=2', 'https://i.ytimg.com/vi/f8dw0JS3Yrg/hqdefault.jpg', 3, '2023-10-02 12:00:00', NOW(), NULL),
(2, 'Ao To Natsu', 'https://www.youtube.com/watch?v=-QxMzUEJH4Q&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=4', 'https://i.ytimg.com/vi/-QxMzUEJH4Q/hqdefault.jpg', 4, '2023-10-02 12:00:00', NOW(), NULL),
(2, 'Mrs. GREEN APPLE「ライラック」Official Music Video', 'https://www.youtube.com/watch?v=QjrkrVmC-8M&list=RDEMOUUs13oBBDlU6w0K1oDe6g&index=5', 'https://i.ytimg.com/vi/QjrkrVmC-8M/hqdefault.jpg', 5, '2023-10-02 12:00:00', NOW(), NULL);

-- Playlist 3 (admin: My Favorite Songs)
INSERT IGNORE INTO playlistItem (playId, title, link, thumbnail, seq, createdAt, updatedAt, deletedAt) VALUES
(3, 'Wrong Right Now', 'https://youtu.be/4ejsUl4XBDI?list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ', 'https://i.ytimg.com/vi/4ejsUl4XBDI/hqdefault.jpg', 1, '2023-10-01 12:00:00', NOW(), NULL),
(3, 'Honky Tonk World', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 2, '2023-10-02 12:00:00', NOW(), NULL),
(3, 'Someday', 'https://www.youtube.com/watch?v=5VJtCd0UT80&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=22&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 3, '2023-10-02 12:00:00', NOW(), NULL),
(3, 'Hips Don''t Lie', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 4, '2023-10-02 12:00:00', NOW(), NULL),
(3, 'Take Me Home Country Roads', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 5, '2023-10-02 12:00:00', NOW(), NULL);

-- Playlist 4 (susybaka: My Favorite Songs1)
INSERT IGNORE INTO playlistItem (playId, title, link, thumbnail, seq, createdAt, updatedAt, deletedAt) VALUES
(4, 'Back Porch', 'https://youtu.be/4VeeXAVQe-8?list=PLcb9huQ-qWFjDcdQ_K_9708MZcocmHJOY', 'https://i.ytimg.com/vi/4VeeXAVQe-8/hqdefault.jpg', 1, '2023-10-02 12:00:00', NOW(), NULL),
(4, 'Wrong Right Now', 'https://youtu.be/4ejsUl4XBDI?list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ', 'https://i.ytimg.com/vi/4ejsUl4XBDI/hqdefault.jpg', 2, '2023-10-01 12:00:00', NOW(), NULL),
(4, 'Honky Tonk World', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 3, '2023-10-02 12:00:00', NOW(), NULL),
(4, 'Someday', 'https://www.youtube.com/watch?v=5VJtCd0UT80&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=22&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 4, '2023-10-02 12:00:00', NOW(), NULL),
(4, 'Hips Don''t Lie', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 5, '2023-10-02 12:00:00', NOW(), NULL),
(4, 'Take Me Home Country Roads', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 6, '2023-10-02 12:00:00', NOW(), NULL);

-- Playlist 5 (susybaka: My Favorite Songs2)
INSERT IGNORE INTO playlistItem (playId, title, link, thumbnail, seq, createdAt, updatedAt, deletedAt) VALUES
(5, 'Wrong Right Now', 'https://youtu.be/4ejsUl4XBDI?list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ', 'https://i.ytimg.com/vi/4ejsUl4XBDI/hqdefault.jpg', 1, '2023-10-01 12:00:00', NOW(), NULL),
(5, 'Honky Tonk World', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 2, '2023-10-02 12:00:00', NOW(), NULL),
(5, 'Someday', 'https://www.youtube.com/watch?v=5VJtCd0UT80&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=22&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 3, '2023-10-02 12:00:00', NOW(), NULL),
(5, 'Hips Don''t Lie', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 4, '2023-10-02 12:00:00', NOW(), NULL),
(5, 'Take Me Home Country Roads', 'https://www.youtube.com/watch?v=IBwY7utufQM&list=PLKyEJ1E1QXRg2xNOGj9IntUtdxPsb6OtJ&index=18&pp=gAQBiAQB', 'https://i.ytimg.com/vi/IBwY7utufQM/hqdefault.jpg', 5, '2023-10-02 12:00:00', NOW(), NULL);

-- Playlist 6 (developer123: 힙한척 할때 듣는 플리)
INSERT IGNORE INTO playlistItem (playId, title, link, thumbnail, seq, createdAt, updatedAt, deletedAt) VALUES
(6, 'Red Hot Chili Peppers - Dark Necessities [OFFICIAL AUDIO]', 'https://www.youtube.com/watch?v=qJ_Tw0w3lLA&list=PLG74aF8jwoCNhOYZY3N7uwG2MuT41zOV0', 'https://i.ytimg.com/vi/qJ_Tw0w3lLA/hqdefault.jpg', 1, '2025-09-13 14:15:08', NOW(), NULL),
(6, 'Break', 'https://www.youtube.com/watch?v=sE0tKkHrwJo&list=PLG74aF8jwoCNhOYZY3N7uwG2MuT41zOV0&index=10', 'https://i.ytimg.com/vi/sE0tKkHrwJo/hqdefault.jpg', 2, '2025-09-13 14:18:24', NOW(), NULL),
(6, 'The Sun', 'https://www.youtube.com/watch?v=cnXVKlebQqc&list=PLG74aF8jwoCNhOYZY3N7uwG2MuT41zOV0&index=39', 'https://i.ytimg.com/vi/cnXVKlebQqc/hqdefault.jpg', 3, '2025-09-13 14:18:38', NOW(), NULL),
(6, '[M/V] 술탄 오브 더 디스코 - 사라지는 꿈', 'https://www.youtube.com/watch?v=7fsavq0mU2k&list=PLG74aF8jwoCNhOYZY3N7uwG2MuT41zOV0&index=63', 'https://i.ytimg.com/vi/7fsavq0mU2k/hqdefault.jpg', 4, '2025-09-13 14:18:50', NOW(), NULL),
(6, '[DADA/ARTIST] 아시안체어샷 (Asian Chairshot) - 꽃 (Flower)', 'https://www.youtube.com/watch?v=WP_tXVGufVw&list=PLG74aF8jwoCNhOYZY3N7uwG2MuT41zOV0&index=123', 'https://i.ytimg.com/vi/WP_tXVGufVw/hqdefault.jpg', 5, '2025-09-13 14:19:13', NOW(), NULL);

-- Playlist 7 (developer123: 십덕 플리)
INSERT IGNORE INTO playlistItem (playId, title, link, thumbnail, seq, createdAt, updatedAt, deletedAt) VALUES
(7, 'うまぴょい伝説', 'https://www.youtube.com/watch?v=VFOg6mHtZcA&list=RDVFOg6mHtZcA&start_radio=1', 'https://i.ytimg.com/vi/VFOg6mHtZcA/hqdefault.jpg', 1, '2025-09-13 14:31:15', NOW(), NULL),
(7, 'テトリス / 重音テトSV', 'https://www.youtube.com/watch?v=Soy4jGPHr3g&list=RDSoy4jGPHr3g&start_radio=1', 'https://i.ytimg.com/vi/Soy4jGPHr3g/hqdefault.jpg', 2, '2025-09-13 14:37:34', NOW(), NULL),
(7, 'お願いマッスル', 'https://youtu.be/-Jget2NBi30?si=X_EQZIJmWW-r3ZIp', 'https://i.ytimg.com/vi/-Jget2NBi30/hqdefault.jpg', 3, '2025-09-13 14:33:03', NOW(), NULL),
(7, 'DECO*27 - モニタリング (Best Friend Remix) feat. 初音ミク', 'https://www.youtube.com/watch?v=C-CYwNz3z8w&list=RDC-CYwNz3z8w&start_radio=1', 'https://i.ytimg.com/vi/C-CYwNz3z8w/hqdefault.jpg', 4, '2025-09-13 14:35:23', NOW(), NULL),
(7, 'YOASOBI「アイドル」 Official Music Video', 'https://youtu.be/ZRtdQ81jPUQ?si=hezJb08AVq0OSewW', 'https://i.ytimg.com/vi/ZRtdQ81jPUQ/hqdefault.jpg', 5, '2025-09-13 14:31:42', NOW(), NULL),
(7, 'fripSide - only my railgun (Audio)', 'https://youtu.be/ZhIxg6_Femo?si=aROnU-w6iiEf8PYw', 'https://i.ytimg.com/vi/ZhIxg6_Femo/hqdefault.jpg', 6, '2025-09-13 14:32:29', NOW(), NULL),
(7, 'Koihakaosunoshimobenari', 'https://www.youtube.com/watch?v=Lcb7Za77lfw&list=PLoe0-nEh-V8f2Adl6S5sJYvBxRoqd589w', 'https://i.ytimg.com/vi/Lcb7Za77lfw/hqdefault.jpg', 7, '2025-09-13 14:34:26', NOW(), NULL),
(7, 'TVアニメ『ダンダダン』HAYASii「Hunting Soul」【lyric video】', 'https://www.youtube.com/watch?v=XoodunTw0kw&list=RDXoodunTw0kw&start_radio=1', 'https://i.ytimg.com/vi/XoodunTw0kw/hqdefault.jpg', 8, '2025-09-13 14:36:46', NOW(), NULL);