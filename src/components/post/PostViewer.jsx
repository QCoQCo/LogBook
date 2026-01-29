import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const PostViewer = ({ markdown }) => {
    return (
        <div className='post-viewer'>
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
                {markdown}
            </ReactMarkdown>
        </div>
    );
};

export default PostViewer;
