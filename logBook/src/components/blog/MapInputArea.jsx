import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useState, useCallback, useRef } from 'react';

const containerStyle = { width: '100%', height: '340px', borderRadius: '12px' };
const defaultCenter = { lat: 37.5665, lng: 126.978 };

const MapInputArea = ({ dispatch, currentContent }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['places'], // 장소 라이브러리 추가
    });

    // 기존 데이터 파싱
    const savedData = currentContent ? JSON.parse(currentContent) : null;
    const [markerData, setMarkerData] = useState(
        savedData || {
            name: '위치를 선택해주세요',
            lat: defaultCenter.lat,
            lng: defaultCenter.lng,
        },
    );

    const onMapClick = useCallback(
        (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            // 역지오코딩 (좌표 -> 주소/이름 변환)
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                let placeName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`; // 기본값은 좌표

                if (status === 'OK' && results[0]) {
                    // 가장 근접한 장소 이름이나 주소 가져오기
                    placeName = results[0].formatted_address;
                }

                const newData = { name: placeName, lat, lng };
                setMarkerData(newData);

                // 부모 모달 state에 JSON으로 저장
                dispatch({
                    type: 'SET_CONTENT',
                    payload: JSON.stringify(newData),
                });
            });
        },
        [dispatch],
    );

    return isLoaded ? (
        <div className="map-input-wrapper">
            <div className="map-info-badge">📍 {markerData.name}</div>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={{ lat: markerData.lat, lng: markerData.lng }}
                zoom={15}
                onClick={onMapClick}
            >
                <Marker position={{ lat: markerData.lat, lng: markerData.lng }} />
            </GoogleMap>
        </div>
    ) : (
        <div className="map-loading">지도를 불러오는 중...</div>
    );
};

export default MapInputArea;
