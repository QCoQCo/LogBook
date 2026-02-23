import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { useState, useCallback } from 'react';

const containerStyle = { width: '100%', height: '400px', borderRadius: '12px' };
const defaultCenter = { lat: 37.5665, lng: 126.978 };
const LIBRARIES = ['places'];

const MapInputArea = ({ dispatch, currentContent }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
        language: 'ko',
        region: 'KR',
    });

    const [map, setMap] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);

    const savedData = currentContent ? JSON.parse(currentContent) : null;
    const [markerData, setMarkerData] = useState(
        savedData || {
            name: '위치를 선택해주세요',
            lat: defaultCenter.lat,
            lng: defaultCenter.lng,
        },
    );

    const onMapLoad = useCallback((mapInstance) => {
        setMap(mapInstance);
    }, []);

    const onAutocompleteLoad = (auto) => {
        setAutocomplete(auto);
    };

    // 1. 자동완성 검색으로 장소 선택 시
    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.geometry.location) {
                alert('장소 상세 정보가 없는 지역입니다.');
                return;
            }

            // [로직 수정] 상호명(name)이 있으면 사용, 없으면 전체 주소(formatted_address) 사용
            const finalName = place.name || place.formatted_address || '알 수 없는 장소';

            const newData = {
                name: finalName,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            };

            setMarkerData(newData);
            if (map) {
                map.panTo({ lat: newData.lat, lng: newData.lng });
                map.setZoom(17);
            }

            dispatch({ type: 'SET_CONTENT', payload: JSON.stringify(newData) });
        }
    };

    // 2. 지도 클릭으로 장소 선택 시 (Geocoder)
    const onMapClick = useCallback(
        (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            const geocoder = new window.google.maps.Geocoder();

            geocoder.geocode({ location: { lat, lng }, language: 'ko' }, (results, status) => {
                let finalName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`; // 기본값은 좌표

                if (status === 'OK' && results[0]) {
                    // Geocoder 결과 중 가장 구체적인 이름이나 주소를 선택
                    // 보통 results[0]은 가장 정확한 도로명 주소를 반환합니다.
                    finalName = results[0].formatted_address;
                }

                const newData = { name: finalName, lat, lng };
                setMarkerData(newData);
                dispatch({ type: 'SET_CONTENT', payload: JSON.stringify(newData) });
            });
        },
        [dispatch],
    );

    return isLoaded ? (
        <div className="map-input-wrapper" style={{ position: 'relative' }}>
            {/* 검색창 커스텀 오버레이 */}
            <div
                style={{
                    position: 'absolute',
                    top: '15px',
                    left: '0px',
                    transform: 'translateX(-10%)',
                    zIndex: 10,
                    width: '85%',
                }}
            >
                <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                    <input
                        type="text"
                        placeholder="장소를 검색하세요"
                        style={{
                            width: '400px',
                            height: '42px',
                            padding: '0 15px',
                            borderRadius: '10px',
                            border: '1px solid #ddd',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            fontSize: '16px',
                            outline: 'none',
                            backgroundColor: '#ffffff',
                        }}
                    />
                </Autocomplete>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={{ lat: markerData.lat, lng: markerData.lng }}
                zoom={15}
                onLoad={onMapLoad}
                onClick={onMapClick}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                <Marker position={{ lat: markerData.lat, lng: markerData.lng }} />
            </GoogleMap>

            {/* 하단 정보 바 */}
            <div
                style={{
                    marginTop: '10px',
                    padding: '12px',
                    backgroundColor: '#dbdce0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    textAlign: 'left',
                    border: '1px solid #eee',
                }}
            >
                📍 <b>선택된 장소:</b> {markerData.name}
            </div>
        </div>
    ) : (
        <div className="map-loading">지도를 불러오는 중...</div>
    );
};

export default MapInputArea;
