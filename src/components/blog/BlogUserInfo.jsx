const BlogUserInfo = ({ user }) => {
    return (
        <div className='user-info-area'>
            <div className='profile-photo'>
                <img id='user-profile-photo' src='/img/userProfile-ex.png' alt='' />
            </div>
            <div className='user-introduction'>
                <textarea></textarea>
            </div>
        </div>
    );
};

export default BlogUserInfo;
