import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogBook } from '../../context/LogBookContext';
import './LogBookIntro.scss';

const LogBookIntro = () => {
    const { isChatPage, setIsChatPage } = useLogBook(); // 다크모드 상태 구독
    const [scrollY, setScrollY] = useState(0);
    const [isVisible, setIsVisible] = useState({});
    const sectionRefs = useRef({});

    // LogBookIntro 페이지 진입 시 다크모드 활성화
    useEffect(() => {
        setIsChatPage(true);

        // LogBookIntro 이탈 시 다크모드 비활성화
        return () => {
            setIsChatPage(false);
        };
    }, [setIsChatPage]);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);

            Object.keys(sectionRefs.current).forEach((key) => {
                const element = sectionRefs.current[key];
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const isInView = rect.top < window.innerHeight && rect.bottom > 0;
                    setIsVisible((prev) => ({ ...prev, [key]: isInView }));
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getHeroOpacity = () => {
        const heroHeight = window.innerHeight * 2; // 200vh
        const fadeStart = heroHeight * 0.2; // 20% 지점에서 페이드 시작
        const fadeEnd = heroHeight * 0.8; // 80% 지점에서 완전히 사라짐

        if (scrollY < fadeStart) return 1;
        if (scrollY > fadeEnd) return 0;

        return 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
    };

    const features = [
        {
            title: '자유로운 블로그 디자인',
            description:
                'React Grid Layout을 활용한 드래그 앤 드롭 블로그 에디터. 이미지, 텍스트, 링크, 지도 등 다양한 요소를 원하는 위치에 자유롭게 배치할 수 있습니다.',
            icon: '🎨',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            tech: ['React Grid Layout', 'Drag & Drop', 'Custom Components'],
        },
        {
            title: '실시간 채팅 시스템',
            description:
                'Firebase Firestore 기반의 실시간 채팅으로 다른 사용자들과 소통하세요. 다중 채팅방, 사용자 상태 관리, 메시지 삭제 등 완전한 채팅 기능을 제공합니다.',
            icon: '💬',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            tech: ['Firebase Firestore', 'Real-time Updates', 'User Presence'],
        },
        {
            title: 'YouTube 음악 플레이리스트',
            description:
                'YouTube API를 활용한 음악 플레이리스트 관리. 팝업 플레이어, Swiper 슬라이더, 실시간 재생 등 완전한 음악 플랫폼 기능을 제공합니다.',
            icon: '🎵',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            tech: ['YouTube API', 'Swiper', 'Popup Player'],
        },
        {
            title: '사용자 인증 & 프로필',
            description:
                'Firebase Authentication을 통한 안전한 사용자 인증. 개성 있는 프로필 생성, 사용자 데이터 관리, 세션 동기화 등 완전한 사용자 시스템을 제공합니다.',
            icon: '👤',
            color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            tech: ['Firebase Auth', 'User Management', 'Session Sync'],
        },
        {
            title: '반응형 UI/UX',
            description:
                '모든 디바이스에서 완벽하게 작동하는 반응형 디자인. SCSS를 활용한 모던한 스타일링과 부드러운 애니메이션으로 최고의 사용자 경험을 제공합니다.',
            icon: '📱',
            color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            tech: ['SCSS', 'Responsive Design', 'CSS Animations'],
        },
        {
            title: '실시간 데이터 동기화',
            description:
                'Firebase를 활용한 실시간 데이터 동기화. 채팅, 플레이리스트, 사용자 상태 등 모든 데이터가 실시간으로 업데이트되어 최신 상태를 유지합니다.',
            icon: '⚡',
            color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            tech: ['Firebase', 'Real-time Sync', 'Data Management'],
        },
    ];

    const techStack = [
        {
            category: 'Frontend',
            technologies: [
                { name: 'React', description: '최신 React 기능 활용', icon: '⚛️' },
                { name: 'Vite', description: '빠른 개발 환경', icon: '⚡' },
                { name: 'SCSS', description: '고급 CSS 전처리기', icon: '🎨' },
                { name: 'React Router', description: 'SPA 라우팅', icon: '🛣️' },
            ],
        },
        {
            category: 'Backend & Database',
            technologies: [
                { name: 'Firebase', description: 'Google의 BaaS 플랫폼', icon: '🔥' },
                { name: 'Firestore', description: 'NoSQL 실시간 데이터베이스', icon: '💾' },
                { name: '추가예정', description: '추가예정', icon: '☠️' },
            ],
        },
        {
            category: 'UI/UX Libraries',
            technologies: [
                { name: 'Swiper', description: '터치 슬라이더 라이브러리', icon: '📱' },
                { name: 'React Grid Layout', description: '드래그 앤 드롭 그리드', icon: '📐' },
                { name: 'Axios', description: 'HTTP 클라이언트', icon: '🌐' },
                { name: '추가예정', description: '추가예정', icon: '☠️' },
            ],
        },
    ];

    return (
        <div id='LogBookIntro'>
            {/* Animated Background */}
            <div className='animated-bg'>
                <div className='stars'></div>
                <div className='twinkling'></div>
                <div className='clouds'></div>
            </div>

            {/* Hero Section */}
            <section
                className='hero-section'
                style={{ transform: `translateY(${scrollY * 0.7}px)` }}
            >
                <div
                    className='hero-content'
                    style={{
                        opacity: getHeroOpacity(),
                    }}
                >
                    <div className='hero-logo' ref={(el) => (sectionRefs.current.logo = el)}>
                        <img
                            src='/img/logBook_logo.png'
                            alt='LogBook Logo'
                            className={`logo-image ${isVisible.logo ? 'animate' : ''}`}
                        />
                    </div>
                    <h1 className='hero-title'>
                        <span className='title-main'>LogBook</span>
                        <span className='title-sub'>당신의 이야기를 기록하세요</span>
                    </h1>
                    <p className='hero-description'>
                        React + Firebase로 구축된 올인원 플랫폼
                        <br />
                        자유롭게 꾸밀 수 있는 블로그, 실시간 채팅, 음악 플레이리스트까지
                        <br />
                        모든 것을 하나의 플랫폼에서 경험해보세요
                    </p>
                    <div className='hero-buttons'>
                        <Link to='/blog' className='btn btn-primary'>
                            블로그 시작하기
                        </Link>
                        <Link to='/chat' className='btn btn-secondary'>
                            채팅 참여하기
                        </Link>
                    </div>
                </div>
                <div className='hero-visual'>
                    <div className='floating-elements'>
                        <div className='element element-1'>📝</div>
                        <div className='element element-2'>💬</div>
                        <div className='element element-3'>🎵</div>
                        <div className='element element-4'>🎨</div>
                        <div className='element element-5'>👥</div>
                        <div className='element element-6'>☠️</div>
                        <div className='element element-7'>🔥</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className='features-section'>
                <div className='container'>
                    <h2 className='section-title' ref={(el) => (sectionRefs.current.title = el)}>
                        <span className={`title-text ${isVisible.title ? 'animate' : ''}`}>
                            LogBook의 특별한 기능들
                        </span>
                    </h2>

                    <div className='features-grid'>
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`feature-card ${
                                    isVisible[`feature-${index}`] ? 'animate' : ''
                                }`}
                                ref={(el) => (sectionRefs.current[`feature-${index}`] = el)}
                                style={{ '--delay': index * 0.2 }}
                            >
                                <div className='feature-icon' style={{ background: feature.color }}>
                                    {feature.icon}
                                </div>
                                <h3 className='feature-title'>{feature.title}</h3>
                                <p className='feature-description'>{feature.description}</p>
                                <div className='feature-tech'>
                                    {feature.tech.map((tech, techIndex) => (
                                        <span key={techIndex} className='tech-tag'>
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className='tech-section'>
                <div className='container'>
                    <h2
                        className='section-title'
                        ref={(el) => (sectionRefs.current.techTitle = el)}
                    >
                        <span className={`title-text ${isVisible.techTitle ? 'animate' : ''}`}>
                            사용된 기술 스택
                        </span>
                    </h2>

                    <div
                        className={`tech-grid ${isVisible.techGrid ? 'animate' : ''}`}
                        ref={(el) => (sectionRefs.current.techGrid = el)}
                    >
                        {techStack.map((category, categoryIndex) => (
                            <div
                                key={categoryIndex}
                                className={`tech-category ${isVisible.techGrid ? 'animate' : ''}`}
                                style={{ '--delay': categoryIndex * 0.3 }}
                            >
                                <h3 className='category-title'>{category.category}</h3>
                                <div className='tech-items'>
                                    {category.technologies.map((tech, techIndex) => (
                                        <div key={techIndex} className='tech-item'>
                                            <div className='tech-icon'>{tech.icon}</div>
                                            <div className='tech-info'>
                                                <h4 className='tech-name'>{tech.name}</h4>
                                                <p className='tech-description'>
                                                    {tech.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interactive Demo Section */}
            <section className='demo-section'>
                <div className='container'>
                    <h2
                        className='section-title'
                        ref={(el) => (sectionRefs.current.demoTitle = el)}
                    >
                        <span className={`title-text ${isVisible.demoTitle ? 'animate' : ''}`}>
                            지금 바로 시작해보세요
                        </span>
                    </h2>

                    <div
                        className='demo-content'
                        ref={(el) => (sectionRefs.current.demoContent = el)}
                    >
                        <div className={`demo-cards ${isVisible.demoContent ? 'animate' : ''}`}>
                            <Link to='/blog' className='demo-card blog-demo'>
                                <div className='demo-icon'>📝</div>
                                <h3>블로그 만들기</h3>
                                <p>드래그 앤 드롭으로 나만의 블로그를 꾸며보세요</p>
                            </Link>

                            <Link to='/chat' className='demo-card chat-demo'>
                                <div className='demo-icon'>💬</div>
                                <h3>채팅 참여하기</h3>
                                <p>실시간으로 다른 사용자들과 소통해보세요</p>
                            </Link>

                            <Link to='/signUp' className='demo-card signup-demo'>
                                <div className='demo-icon'>🚀</div>
                                <h3>회원가입</h3>
                                <p>LogBook의 모든 기능을 이용해보세요</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className='cta-section'>
                <div className='container'>
                    <div className='cta-content' ref={(el) => (sectionRefs.current.cta = el)}>
                        <h2 className={`cta-title ${isVisible.cta ? 'animate' : ''}`}>
                            당신의 이야기가 시작되는 곳
                        </h2>
                        <p className={`cta-description ${isVisible.cta ? 'animate' : ''}`}>
                            LogBook과 함께 새로운 경험을 시작해보세요
                        </p>
                        <Link
                            to='/signUp'
                            className={`btn btn-cta ${isVisible.cta ? 'animate' : ''}`}
                        >
                            지금 시작하기
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LogBookIntro;
