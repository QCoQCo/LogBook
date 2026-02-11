export const POST_LAYOUT = {
    TITLE_ONLY: 'TITLE_ONLY',
    VERTICAL_CARD: 'VERTICAL_CARD',
    HORIZONTAL_CARD: 'HORIZONTAL_CARD',
    IMAGE_ONLY: 'IMAGE_ONLY',
};

export const getPostLayout = (item) => {
    const { w, h } = item;

    // 1. 최우선 규칙 - 높이가 1 이면 게시물 제목만으로 표기
    if (h === 1) {
        return POST_LAYOUT.TITLE_ONLY;
    }

    const hRatio = h / w;
    const wRatio = w / h;

    // 2. 세로가 2배 초과 → 수직 카드 ( 이미지 + 제목의 카드 형식 )
    if (hRatio > 2) {
        return POST_LAYOUT.VERTICAL_CARD;
    }

    // 3. 가로가 3배 이상 → 좌측 이미지 + (제목 + 내용) 의 flex
    if (wRatio >= 1.5) {
        return POST_LAYOUT.HORIZONTAL_CARD;
    }

    // 4. 나머지 → 이미지 단독
    return POST_LAYOUT.IMAGE_ONLY;
};

export default { POST_LAYOUT, getPostLayout };
