import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FloatingButton.scss';
import { useAuth } from '../../context/LogBookContext';

const FloatingButton = () => {
    const [open, setOpen] = useState(false);
    const { isLogin } = useAuth();
    const navigate = useNavigate();

    const toggle = () => setOpen((s) => !s);

    const scrollTop = () => {
        setOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goNewPost = () => {
        setOpen(false);
        navigate('/post/write'); // adjust route to your writing page
        scrollTop();
    };

    const goChat = () => {
        setOpen(false);
        navigate('/chat'); // adjust route to your chat page
        scrollTop();
    };

    if (!isLogin) return null;

    const actions = [
        {
            key: 'top',
            title: '맨 위로',
            onClick: scrollTop,
            icon: (
                <svg
                    viewBox='0 0 24 24'
                    width='18'
                    height='18'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden
                >
                    <path d='M12 19V6' />
                    <path d='M5 13l7-7 7 7' />
                </svg>
            ),
        },
        {
            key: 'write',
            title: '새 글쓰기',
            onClick: goNewPost,
            icon: (
                <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor' aria-hidden>
                    <path d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z' />
                    <path d='M20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z' />
                </svg>
            ),
        },
        {
            key: 'chat',
            title: '채팅',
            onClick: goChat,
            icon: (
                <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor'>
                    <path d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' />
                </svg>
            ),
        },
    ];

    const angles = [-90, -135, -180]; // degrees for each action (arc shape)
    const radius = 84; // px distance from the toggle

    return (
        <div id='FloatingButton' className={open ? 'open' : ''} aria-hidden={false}>
            <div className='fab-actions' aria-hidden={!open}>
                {actions.map((a, i) => {
                    const deg = angles[i] ?? -90 - i * 30;
                    const rad = (deg * Math.PI) / 180;
                    const x = Math.cos(rad) * radius;
                    const y = Math.sin(rad) * radius;
                    const style = {
                        transform: open
                            ? `translate(${x}px, ${y}px) scale(1)`
                            : `translate(0px, 0px) scale(0.6)`,
                        opacity: open ? 1 : 0,
                        pointerEvents: open ? 'auto' : 'none',
                        transitionDelay: `${i * 40}ms`,
                    };
                    return (
                        <button
                            key={a.key}
                            className='fab-action'
                            title={a.title}
                            onClick={a.onClick}
                            style={style}
                            aria-hidden={!open}
                        >
                            {a.icon}
                        </button>
                    );
                })}
            </div>
            <button
                className='fab-toggle'
                aria-label={open ? '메뉴 닫기' : '빠른 액션 열기'}
                aria-expanded={open}
                onClick={toggle}
            >
                {/* single plus icon that rotates when open */}
                <svg
                    className={`toggle-icon ${open ? 'open' : ''}`}
                    viewBox='0 0 24 24'
                    width='30'
                    height='30'
                    fill='currentColor'
                >
                    <path
                        d='M12 5v14M5 12h14'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            </button>
        </div>
    );
};

export default FloatingButton;
