// modalReducer.js
export const initialModalState = {
    modalContent: '',
    isEmptyError: false,
    searchKeyword: '',
    selectedPost: null,
    postThumbnail: null,
    imageFile: null,
};

export function modalReducer(state, action) {
    switch (action.type) {
        case 'INIT_CONTENT':
            return {
                ...state,
                modalContent: action.payload || '',
            };

        case 'SET_CONTENT':
            return {
                ...state,
                modalContent: action.payload,
                isEmptyError: false,
            };

        case 'SET_EMPTY_ERROR':
            return {
                ...state,
                isEmptyError: true,
            };

        case 'SET_SEARCH_KEYWORD':
            return {
                ...state,
                searchKeyword: action.payload,
            };

        case 'SET_SELECTED_POST':
            return {
                ...state,
                selectedPost: action.payload,
                modalContent: action.payload,
            };

        case 'SET_POST_THUMBNAIL':
            return {
                ...state,
                postThumbnail: action.payload,
            };

        case 'SET_IMAGE_FILE':
            return {
                ...state,
                imageFile: action.payload,
            };

        case 'RESET':
            return initialModalState;

        default:
            return state;
    }
}
