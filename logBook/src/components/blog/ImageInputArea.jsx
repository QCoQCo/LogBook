import { useState, useRef, useEffect } from 'react';

export const ImageInputArea = ({ dispatch }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        dispatch({
            type: 'SET_IMAGE_FILE',
            payload: file,
        });

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    const handleChangeFile = (e) => {
        const file = e.target.files?.[0];
        handleFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    return (
        <div className="image-modal-area">
            <div
                className={`image-drop-zone ${isDragging ? 'dragging' : ''}`}
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleChangeFile}
                    hidden
                />

                {!previewUrl && (
                    <div className="placeholder">
                        <p>이미지를 드래그하거나 클릭하여 업로드하세요</p>
                    </div>
                )}

                {previewUrl && (
                    <div className="image-preview">
                        <img src={previewUrl} alt="업로드 미리보기" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageInputArea;
