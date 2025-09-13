import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { useBlog } from '../../context';

const PostPreview = () => {
    const { markdown, postTitle } = useBlog();

    return (
        <div className='post-preview'>
            <div className='preview-pane'>
                <div className='post-preview-title'>
                    <h1>{postTitle}</h1>
                </div>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                        code({ className, children }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                                <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag='div'
                                    className='code-block'
                                >
                                    {String(children)
                                        .replace(/\n$/, '')
                                        .replace(/\n&nbsp;\n/g, '')
                                        .replace(/\n&nbsp\n/g, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <SyntaxHighlighter
                                    style={oneDark}
                                    language='textile'
                                    PreTag='div'
                                    className='code-block'
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
