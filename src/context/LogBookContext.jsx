//이 컴포넌트의 모든 코드는 예시로 적은 것. 논의 필요
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    collection,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// LogBookContext 생성
const LogBookContext = createContext();

// LogBookProvider 컴포넌트
export const LogBookProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 메시지 전송 함수
    const sendMessage = useCallback(async (messageText, userId, userName) => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Firebase Firestore에 메시지 저장
            // await addDoc(collection(db, 'messages'), {
            //   text: messageText,
            //   userId: userId,
            //   userName: userName,
            //   timestamp: serverTimestamp(),
            // });

            console.log('메시지 전송:', messageText); // 메시지 전송 확인용
        } catch (err) {
            setError('메시지 전송에 실패했습니다.');
            console.error('메시지 전송 오류:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 실시간 메시지 구독 함수
    const subscribeToMessages = useCallback(() => {
        try {
            // TODO: Firebase Firestore 실시간 리스너 설정
            // const messagesQuery = query(
            //   collection(db, 'messages'),
            //   orderBy('timestamp', 'asc'),
            //   limit(100)
            // );

            // const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            //   const messageList = [];
            //   snapshot.forEach((doc) => {
            //     messageList.push({
            //       id: doc.id,
            //       ...doc.data()
            //     });
            //   });
            //   setMessages(messageList);
            // }, (err) => {
            //   setError('메시지 로딩에 실패했습니다.');
            //   console.error('메시지 구독 오류:', err);
            // });

            // return unsubscribe;

            console.log('실시간 메시지 구독 시작');
        } catch (err) {
            setError('메시지 구독 설정에 실패했습니다.');
            console.error('메시지 구독 설정 오류:', err);
        }
    }, []);

    // 컴포넌트 마운트 시 실시간 구독 시작
    // useEffect(() => {
    // const unsubscribe = subscribeToMessages();

    // 컴포넌트 언마운트 시 구독 해제
    // return () => {
    //     if (unsubscribe) {
    //         unsubscribe();
    //     }
    // };
    // }, [subscribeToMessages]);

    const value = {
        messages,
        loading,
        error,
        sendMessage,
    };

    return <LogBookContext.Provider value={value}>{children}</LogBookContext.Provider>;
};

export const useLogBook = () => {
    const context = useContext(LogBookContext);
    if (!context) {
        throw new Error('useLogBook must be used within a LogBookProvider');
    }
    return context;
};
