const PostStickyUtils = ({ headerHeight, isLiked, likes, handleClickLike, handleClickShare }) => {
    return (
        <div className='sticky-utils' style={{ marginTop: `${headerHeight}px` }}>
            <div className='utils-like'>
                <button
                    className={isLiked ? 'like-btn liked' : 'like-btn'}
                    onClick={handleClickLike}
                >
                    <svg width='24' height='24' viewBox='0 0 24 24'>
                        <path fill='currentColor' d='M18 1l-6 4-6-4-6 5v7l12 10 12-10v-7z'></path>
                    </svg>
                </button>
                <p>{likes}</p>
            </div>
            <button className='share-btn' onClick={handleClickShare}>
                <svg width='24' height='24' viewBox='0 0 24 24'>
                    <path
                        fill='currentColor'
                        d='M5 7c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5zm11.122 12.065c-.073.301-.122.611-.122.935 0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4c-1.165 0-2.204.506-2.935 1.301l-5.488-2.927c-.23.636-.549 1.229-.943 1.764l5.488 2.927zm7.878-15.065c0-2.209-1.791-4-4-4s-4 1.791-4 4c0 .324.049.634.122.935l-5.488 2.927c.395.535.713 1.127.943 1.764l5.488-2.927c.731.795 1.77 1.301 2.935 1.301 2.209 0 4-1.791 4-4z'
                    ></path>
                </svg>
            </button>
        </div>
    );
};

export default PostStickyUtils;
