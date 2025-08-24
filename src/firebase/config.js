// 이 파일은 예시로 적은 것. 논의 필요
// Firebase 설정 파일
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 설정 객체 (실제 프로젝트 설정으로 교체 필요)
const firebaseConfig = {
    // TODO: 실제 Firebase 프로젝트 설정으로 교체
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id',
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 인스턴스
export const db = getFirestore(app);

// Firebase Auth 인스턴스
export const auth = getAuth(app);

export default app;
