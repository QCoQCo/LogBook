const PostToolBar = ({ hideTitle, onClickFunctions }) => {
    const toolbarItems = [
        {
            className: 'h1-btn',
            imgSrc: '/img/icon-h1.png',
            altText: 'h1 추가',
        },
        {
            className: 'h2-btn',
            imgSrc: '/img/icon-h2.png',
            altText: 'h2 추가',
        },
        {
            className: 'h3-btn',
            imgSrc: '/img/icon-h3.png',
            altText: 'h3 추가',
        },
        {
            className: 'toolbar-seperator',
        },
        {
            className: 'bold-btn',
            imgSrc: '/img/icon-bold.png',
            altText: '볼드 추가',
        },
        {
            className: 'italic-btn',
            imgSrc: '/img/icon-italic.png',
            altText: '이탤릭 추가',
        },
        {
            className: 'line-through-btn',
            imgSrc: '/img/icon-line-through.png',
            altText: '취소선 추가',
        },
        {
            className: 'toolbar-seperator',
        },
        {
            className: 'quote-btn',
            imgSrc: '/img/icon-quote.png',
            altText: '인용 추가',
        },
        {
            className: 'link-btn',
            imgSrc: '/img/icon-link.png',
            altText: '링크 추가',
        },
        {
            className: 'image-btn',
            imgSrc: '/img/icon-image.png',
            altText: '이미지 추가',
        },
        {
            className: 'code-btn',
            imgSrc: '/img/icon-code.png',
            altText: '코드 추가',
        },
    ];

    return (
        <div
            className={
                hideTitle ? 'post-editor-toolbar toolbar-top-position' : 'post-editor-toolbar'
            }
        >
            {toolbarItems.map((item, i) => {
                if (item.className === 'toolbar-seperator') {
                    return <span className='toolbar-seperator' key={i}></span>;
                } else {
                    return (
                        <button className={item.className} onClick={onClickFunctions[i]} key={i}>
                            <img src={item.imgSrc} alt={item.altText} />
                        </button>
                    );
                }
            })}
        </div>
    );
};

export default PostToolBar;
