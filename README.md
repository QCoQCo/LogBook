# ☠️ LogBook 🏴‍☠️

### 海賊の航海日誌 — 自由なソーシャルブログプラットフォーム / 해적의 항해일지 - 자유로운 소셜 블로그 플랫폼

<div align="center">

---

## 🌐 언어 선택 / 言語選択

<details>
<summary><strong>🇰🇷 한국어</strong> · <strong>🇯🇵 日本語</strong> — 클릭하여 선택 / クリックして選択</summary>

| | |
|---|---|
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
- [🏴‍☠️ 주요 기능](#ko-features)
- [⚡ 기술 스택](#ko-tech-stack)
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

<span id="ko-features"></span>
### 🏴‍☠️ 주요 기능

| 영역 | 기능 |
|------|------|
| **블로그** | React Grid Layout 드래그 앤 드롭, 이미지/텍스트/링크/지도 컴포넌트, 실시간 미리보기 |
| **채팅** | Firebase 기반 다중 채팅방, 실시간 메시지, 참여자 관리 |
| **음악** | YouTube API 연동 플레이리스트, 팝업 플레이어 |
| **글쓰기** | Velog 스타일 마크다운 에디터, 코드 하이라이팅, 이미지 업로드 |
| **인증** | 이메일 로그인, Google / Kakao / Naver OAuth2 |

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

| 기술 | 버전 | 용도 |
|------|------|------|
| React | ^19.1.1 | UI 라이브러리 |
| Vite | ^7.1.2 | 빌드 도구 |
| React Router | ^7.8.1 | SPA 라우팅 |
| SCSS | - | 스타일링 |
| React Grid Layout | ^1.5.2 | 드래그 앤 드롭 그리드 |
| React Markdown | ^10.1.0 | 마크다운 렌더링 |
| Swiper | ^12.1.2 | 슬라이더/캐러셀 |
| Axios | ^1.11.0 | HTTP 클라이언트 |
| Firebase | ^12.1.0 | 인증, Firestore |

#### Backend

| 기술 | 용도 |
|------|------|
| Spring Boot | ^4.0.1 | 백엔드 프레임워크 |
| Spring Security | - | 인증/인가 |
| Spring WebSocket | - | 실시간 통신 |
| JPA / MySQL | - | 데이터베이스 |
| JWT | - | 토큰 기반 인증 |
| OAuth2 | - | 소셜 로그인 |

#### 기타

- **SMTP**: 이메일 발송
- **YouTube Data API**: 음악 검색
- **Google Maps API**: 지도 컴포넌트

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

---

<span id="ko-config"></span>
### 🔧 설정 가이드

프로젝트 루트의 `.env` 파일에 아래 항목을 설정합니다. 실제 키/비밀번호는 저장소에 올리지 마세요.

| 구분 | 변수 예시 | 설명 |
|------|-----------|------|
| **Firebase** | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` 등 | Firebase 콘솔에서 발급 |
| **DB** | `db.host`, `db.port`, `db.name`, `db.username`, `db.password` | MySQL 연결 정보 |
| **OAuth** | `GOOGLE_CLIENT_ID`, `KAKAO_CLIENT_ID`, `NAVER_CLIENT_ID` 및 각 `_SECRET` | 각 개발자 콘솔에서 발급 |
| **SMTP** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` | 이메일 발송용 |
| **API** | `VITE_GOOGLE_MAPS_API_KEY`, `YOUTUBE_API_KEY` | 지도·YouTube 연동 |

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
- [🏴‍☠️ 主な機能](#ja-features)
- [⚡ 技術スタック](#ja-tech-stack)
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
│       ├── entity/         # JPAエンティティ
│       ├── repository/     # データアクセス層
│       └── config/         # セキュリティ、WebSocket等の設定
├── .env                     # 環境変数 (Firebase, DB, OAuth, APIキー等)
└── README.md
```

---

<span id="ja-features"></span>
### 🏴‍☠️ 主な機能

| 領域 | 機能 |
|------|------|
| **ブログ** | React Grid Layoutでドラッグ＆ドロップ、画像/テキスト/リンク/地図コンポーネント、リアルタイムプレビュー |
| **チャット** | Firebaseによる複数チャットルーム、リアルタイムメッセージ、参加者管理 |
| **音楽** | YouTube API連携プレイリスト、ポップアッププレイヤー |
| **執筆** | Velog風マークダウンエディタ、コードハイライト、画像アップロード |
| **認証** | メールログイン、Google / Kakao / Naver OAuth2 |

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

| 技術 | バージョン | 用途 |
|------|------|------|
| React | ^19.1.1 | UIライブラリ |
| Vite | ^7.1.2 | ビルドツール |
| React Router | ^7.8.1 | SPAルーティング |
| SCSS | - | スタイリング |
| React Grid Layout | ^1.5.2 | ドラッグ＆ドロップグリッド |
| React Markdown | ^10.1.0 | マークダウンレンダリング |
| Swiper | ^12.1.2 | スライダー/カルーセル |
| Axios | ^1.11.0 | HTTPクライアント |
| Firebase | ^12.1.0 | 認証、Firestore |

#### バックエンド

| 技術 | 用途 |
|------|------|
| Spring Boot | ^4.0.1 | バックエンドフレームワーク |
| Spring Security | - | 認証/認可 |
| Spring WebSocket | - | リアルタイム通信 |
| JPA / MySQL | - | データベース |
| JWT | - | トークンベース認証 |
| OAuth2 | - | ソーシャルログイン |

#### その他

- **SMTP**: メール送信
- **YouTube Data API**: 音楽検索
- **Google Maps API**: 地図コンポーネント

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

---

<span id="ja-config"></span>
### 🔧 設定ガイド

プロジェクトルートの `.env` に以下の項目を設定します。実際のキー・パスワードはリポジトリに含めないでください。

| 区分 | 変数例 | 説明 |
|------|--------|------|
| **Firebase** | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` 等 | Firebaseコンソールで発行 |
| **DB** | `db.host`, `db.port`, `db.name`, `db.username`, `db.password` | MySQL接続情報 |
| **OAuth** | `GOOGLE_CLIENT_ID`, `KAKAO_CLIENT_ID`, `NAVER_CLIENT_ID` および各 `_SECRET` | 各開発者コンソールで発行 |
| **SMTP** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` | メール送信用 |
| **API** | `VITE_GOOGLE_MAPS_API_KEY`, `YOUTUBE_API_KEY` | 地図・YouTube連携 |

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
