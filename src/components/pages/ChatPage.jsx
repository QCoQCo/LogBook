import { useState, useRef, useEffect } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import { useLogBook } from '../../context/LogBookContext';
import './ChatPage.scss';

const ReactGridLayout = WidthProvider(RGL);

const ChatPage = () => {
    const [layout, setLayout] = useState([
        { i: 'item1', x: 0, y: 0, w: 2, h: 1 },
        { i: 'item2', x: 2, y: 0, w: 2, h: 1 },
        { i: 'item3', x: 4, y: 0, w: 2, h: 1 },
        { i: 'item4', x: 6, y: 0, w: 2, h: 1 },
    ]);

    // 채팅 관련 상태
    const [messageInput, setMessageInput] = useState('');
    const [currentUser, setCurrentUser] = useState({
        id: 'user1', // TODO: 실제 사용자 ID로 교체
        name: '사용자', // TODO: 실제 사용자 이름으로 교체
    });

    // LogBook Context 사용
    const { messages, loading, error, sendMessage } = useLogBook();

    // 메시지 영역 스크롤을 위한 ref
    const messagesEndRef = useRef(null);

    const onLayoutChange = (newLayout) => {
        setLayout(newLayout);
    };

    // 메시지 전송 핸들러
    const handleSendMessage = async () => {
        if (messageInput.trim()) {
            // TODO: Firebase를 통한 메시지 전송
            // await sendMessage(messageInput, currentUser.id, currentUser.name);
            console.log('메시지 전송:', messageInput);
            setMessageInput('');
        }
    };

    // Enter 키로 메시지 전송
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 메시지 영역 자동 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div id='ChatPage'>
            <div className='container'>
                <div className='chat-area'>
                    <div className='chat-area-header'>
                        <div className='chat-area-header-title'>
                            <h1>Chat-Area</h1>
                        </div>
                    </div>
                    <div className='chat-area-content'>
                        {/* TODO: Firebase 실시간 메시지 표시 */}
                        {loading && <div className='loading'>메시지 로딩 중...</div>}
                        {error && <div className='error'>{error}</div>}

                        <div className='messages-container'>
                            {/* TODO: 실제 메시지 렌더링 */}
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`message ${
                                        message.userId === currentUser.id
                                            ? 'own-message'
                                            : 'other-message'
                                    }`}
                                >
                                    <div className='message-header'>
                                        <span className='user-name'>{message.userName}</span>
                                        <span className='timestamp'>
                                            {message.timestamp?.toDate?.()?.toLocaleTimeString() ||
                                                '방금 전'}
                                        </span>
                                    </div>
                                    <div className='message-content'>{message.text}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className='chat-area-input'>
                        <input
                            type='text'
                            placeholder='메시지를 입력하세요.'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button onClick={handleSendMessage} disabled={loading}>
                            {loading ? '전송 중...' : '전송'}
                        </button>
                    </div>
                </div>
                <div className='list-area'>
                    {/* 리스트 컴포넌트로 대체될 항목 */}
                    <div className='list grid-container'>
                        <ReactGridLayout
                            className='layout'
                            onLayoutChange={onLayoutChange}
                            layout={layout}
                            rowHeight={30}
                            compactType='horizontal'
                            isDraggable={true}
                            isResizable={true}
                            autoSize={false}
                            preventCollision={false}
                            bounds='parent'
                            margin={[5, 5]}
                            containerPadding={[10, 10]}
                            useCSSTransforms={true}
                            transformScale={1}
                            isBounded={true}
                            resizeHandles={[]}
                        >
                            <div key='item1' className='grid-item'>
                                <span className='text'>항목1</span>
                            </div>
                            <div key='item2' className='grid-item'>
                                <span className='text'>항목2</span>
                            </div>
                            <div key='item3' className='grid-item'>
                                <span className='text'>항목3</span>
                            </div>
                            <div key='item4' className='grid-item'>
                                <span className='text'>항목4</span>
                            </div>
                        </ReactGridLayout>
                    </div>
                    <div className='list'>
                        <ul>
                            <li>리스트</li>
                            <li>리스트</li>
                            <li>리스트</li>
                            <li>리스트</li>
                        </ul>
                    </div>
                    <div className='list'>
                        <ul>
                            <li>리스트</li>
                            <li>리스트</li>
                            <li>리스트</li>
                            <li>리스트</li>
                        </ul>
                    </div>
                    <div className='list'>
                        <ul>
                            <li>리스트</li>
                            <li>리스트</li>
                            <li>리스트</li>
                        </ul>
                    </div>
                    {/* 리스트 컴포넌트로 대체될 항목 */}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
