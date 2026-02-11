import { useBlog } from '../../context';

import { POST_LAYOUT, getPostLayout } from '../../utils/gridLayoutUtils';
import PostHorizontalCard from './PostHorizontalCard';
import PostImageOnly from './PostImageOnly';
import PostTitleOnly from './PostTitleOnly';
import PostVerticalCard from './PostVerticalCard';

export const PostGridContent = ({ item, element }) => {
    const { isBlogEditing } = useBlog();
    const { content, meta } = element;

    if (!content) {
        return (
            <p className="default-text">
                {isBlogEditing ? '내용을 입력하기 위해 클릭' : '빈 블럭입니다'}
            </p>
        );
    } else {
        const layout = getPostLayout(item);

        switch (layout) {
            case POST_LAYOUT.TITLE_ONLY:
                return (
                    <PostTitleOnly layout={layout} postId={content.postId} title={content.title} />
                );

            case POST_LAYOUT.VERTICAL_CARD:
                return (
                    <PostVerticalCard
                        layout={layout}
                        postId={content.postId}
                        thumbnail={meta.thumbnail}
                        title={content.title}
                    />
                );

            case POST_LAYOUT.HORIZONTAL_CARD:
                return (
                    <PostHorizontalCard
                        layout={layout}
                        postId={content.postId}
                        thumbnail={meta.thumbnail}
                        title={content.title}
                        content={content.content}
                    />
                );

            default:
                return (
                    <PostImageOnly
                        layout={layout}
                        postId={content.postId}
                        thumbnail={meta.thumbnail}
                    />
                );
        }
    }
};

export default PostGridContent;
