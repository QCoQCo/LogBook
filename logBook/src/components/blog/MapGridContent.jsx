import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useMemo } from 'react';

const containerStyle = { width: '100%', height: '100%', minHeight: '150px' };
// libraries 배열은 렌더링마다 변하지 않게 컴포넌트 외부에서 정의하는 것이 좋습니다.
const LIBRARIES = ['places'];

const MapGridContent = ({ element }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES, // MapInputArea와 동일하게 설정
        language: 'ko', // 동일하게 설정
        region: 'KR', // 동일하게 설정
    });

    const mapData = useMemo(() => {
        try {
            return element.content ? JSON.parse(element.content) : null;
        } catch (e) {
            console.error('Map 데이터 파싱 실패', e);
            return null;
        }
    }, [element.content]);

    if (!mapData) {
        return <p className="default-text">설정된 장소가 없습니다.</p>;
    }

    return (
        <div className="map-grid-container" style={{ width: '100%', height: '100%' }}>
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={{ lat: mapData.lat, lng: mapData.lng }}
                    zoom={15}
                    options={{
                        disableDefaultUI: true,
                        gestureHandling: 'none',
                        draggable: false,
                        keyboardShortcuts: false,
                        clickableIcons: false,
                        scrollwheel: false,
                    }}
                >
                    <Marker position={{ lat: mapData.lat, lng: mapData.lng }} />
                </GoogleMap>
            ) : (
                <div className="map-loading-placeholder">지도 로딩 중...</div>
            )}
        </div>
    );
};

export default MapGridContent;
