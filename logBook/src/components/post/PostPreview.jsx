import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { usePost } from '../../context';

const PostPreview = () => {
    const { markdown, postTitle } = usePost();

    return (
        <div className="post-preview">
            <div className="preview-pane">
                <div className="post-preview-title">
                    <h1>{postTitle}</h1>
                </div>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                        a({ node, children, href, ...props }) {
                            // URL 유효성 검사 함수
                            const isExternal =
                                href && (href.startsWith('http://') || href.startsWith('https://'));
                            const isRelative =
                                href &&
                                (href.startsWith('/') ||
                                    href.startsWith('./') ||
                                    href.startsWith('../'));

                            // 프로토콜도 없고, 상대 경로 기호도 없는 값
                            const isValid = isExternal || isRelative;

                            const handleClick = (e) => {
                                if (!isValid) {
                                    e.preventDefault(); // 이동 방지
                                    alert('유효하지 않은 링크 형식입니다.');
                                    return;
                                }
                            };

                            return (
                                <a
                                    {...props}
                                    href={href}
                                    target={'_blank'}
                                    rel="noopener noreferrer"
                                    onClick={handleClick}
                                    style={{
                                        color: isValid ? '#00bfa5' : '#ff5252', // 유효하지 않으면 빨간색으로 표시 가능
                                        textDecoration: 'underline',
                                        cursor: isValid ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    {children}
                                </a>
                            );
                        },
                        code({ className, children }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                                <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    className="code-block"
                                >
                                    {String(children)
                                        .replace(/\n$/, '')
                                        .replace(/\n&nbsp;\n/g, '')
                                        .replace(/\n&nbsp\n/g, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <SyntaxHighlighter
                                    style={oneDark}
                                    language="textile"
                                    PreTag="div"
                                    className="code-block"
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            );
                        },
                        blockquote({ children, ...props }) {
                            return (
                                <blockquote
                                    style={{
                                        background: '#d0d0d09b',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        borderLeft: '5px solid #00bfa5',
                                        margin: '10px 0',
                                    }}
                                    {...props}
                                >
                                    {children}
                                </blockquote>
                            );
                        },
                        img({ ...props }) {
                            return (
                                <img
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: '5px',
                                    }}
                                    src={props.src?.replace('../../../public/', '/')}
                                    alt={props.alt ? props.alt : 'React-Markdown-Image Alt'}
                                />
                            );
                        },
                        em({ children, ...props }) {
                            return (
                                <span style={{ fontStyle: 'italic', color: '#555' }} {...props}>
                                    {children}
                                </span>
                            );
                        },
                    }}
                >
                    {/* 
                        1. 개행 문자 두개를 한개로 인식하는 마크다운 특성을 한 번의 개행으로도 줄 바꿈이 
                        일어나도록 변경함.
                        2. 
                    */}
                    {markdown}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default PostPreview;
