const ChatMessage = ({ messages, currentUser, handleDeleteMessage, messagesEndRef }) => {
    return (
        <div className='chat-message'>
            <div className='messages-container'>
                {/* 실시간 메시지 렌더링 */}
                {messages.map((message) => {
                    // 메시지 소유권 판별: 같은 사용자 ID 또는 sessionId로 구분
                    const isOwnMessage =
                        message.userId === currentUser.id ||
                        (message.sessionId && message.sessionId === currentUser.sessionId);

                    return (
                        <div
                            key={message.id}
                            className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                        >
                            <div className='message-header'>
                                <span className='user-name'>{message.userName}</span>
                                <span className='timestamp'>
                                    {message.timestamp?.toDate?.()?.toLocaleTimeString() ||
                                        '방금 전'}
                                </span>
                                {isOwnMessage && (
                                    <button
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className='delete-button'
                                        title='메시지 삭제'
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                            <div className='message-content'>{message.text}</div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatMessage;
