## ☠️LogBook🏴‍☠️is a simple React-vite fullstack Blog project

# this is DEV branch

# 의논이 필요한 사항

## Firebase 실시간 채팅 기능 설정

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. Authentication 활성화 (필요시)

### 2. Firebase 설정 파일 구성

1. `src/firebase/config.js` 파일의 설정값을 참고하여 실제 프로젝트 값으로 교체
2. Firebase 프로젝트 설정에서 웹 앱 추가 후 제공되는 설정값 사용

### 3. Firestore 보안 규칙 설정

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow read, write: if true; // 대충만든 보안 규칙 -> 의논 후 설정 필요
    }
  }
}
```

### 4. 채팅 기능 활성화

현재 코드에서 주석 처리된 Firebase 관련 함수들:

1. `src/context/LogBookContext.jsx`에서 주석 처리된 Firebase 함수들
2. `src/components/pages/ChatPage.jsx`에서 주석 처리된 메시지 전송 함수

### 5. 사용자 인증 (의논 후 결정)

실제 사용자 인증을 구현하려면:

1. Firebase Authentication 설정
2. `ChatPage.jsx`의 `currentUser` 상태를 실제 인증된 사용자 정보로 교체
3. 해야 한다고 함
