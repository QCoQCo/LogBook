import './ChatPage.scss';

const ChatPage = () => {
    return (
        <div id='ChatPage'>
            <div className='container'>
                <div className='chat-area'>
                    <div className='chat-area-header'>
                        <div className='chat-area-header-title'>
                            <h1>Chat-Area</h1>
                        </div>
                    </div>
                    <div className='chat-area-content'>채팅영역</div>
                    <div className='chat-area-input'>
                        <input type='text' placeholder='메시지를 입력하세요.' />
                        <button>전송</button>
                    </div>
                </div>
                <div className='list-area'>
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
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
