// 카카오T 퀵 API 설정
const KAKAO_API_CONFIG = {
    API_KEY: '55cef59b-8544-4733-9b4d-00ebc08736b2',
    VENDOR_ID: 'VZQSH2',
    BASE_URL: 'https://open-api-logistics.kakaomobility.com/goa-sandbox-service/api/v2',
    ENDPOINTS: {
        PRICE: '/orders/price'
    }
};

// 실시간 요금 조회 함수
async function getKakaoQuickFare(pickup, dropoff, orderType, size) {
    try {
        const requestBody = {
            orderType: orderType, // 'QUICK', 'QUICK_ECONOMY', 'QUICK_EXPRESS', 'DOBO'
            productSize: size, // 'XS', 'S', 'M', 'L'
            pickup: {
                location: {
                    basicAddress: pickup.address,
                    detailAddress: '',
                    latitude: pickup.lat,
                    longitude: pickup.lng
                }
            },
            dropoff: {
                location: {
                    basicAddress: dropoff.address,
                    detailAddress: '',
                    latitude: dropoff.lat,
                    longitude: dropoff.lng
                }
            }
        };

        // 대형(L) 사이즈일 경우 필수 필드 추가
        if (size === 'L') {
            requestBody.fleetOption = {
                fleet: 'TON',
                type: 'NORMAL'
            };
            requestBody.pickup.loadingMethod = 'PICKER';
            requestBody.dropoff.loadingMethod = 'PICKER';
        }

        // Netlify Function 엔드포인트 사용 (로컬 및 프로덕션 자동 감지)
        const functionUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8888/.netlify/functions/kakao-quick-price'
            : '/.netlify/functions/kakao-quick-price';

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('API 응답 오류:', errorData);
            throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            success: true,
            data: {
                totalPrice: data.totalPrice,
                maximum: data.maximum,
                minimum: data.minimum,
                orderType: orderType,
                productSize: size
            }
        };
    } catch (error) {
        console.error('카카오T 퀵 API 오류:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 주소를 좌표로 변환하는 함수 (카카오 주소 검색 API 사용)
async function getCoordinates(address) {
    try {
        // 카카오 REST API 키가 필요합니다
        const KAKAO_REST_KEY = '65c0cdb0a66e605b8019d180de3e99d1'; // TODO: 여기에 REST API 키 입력
        
        console.log('카카오 API 호출:', {
            address: address,
            key: KAKAO_REST_KEY.substring(0, 10) + '...',
            url: `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`
        });
        
        const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
            {
                headers: {
                    'Authorization': `KakaoAK ${KAKAO_REST_KEY}`
                }
            }
        );

        const data = await response.json();
        
        if (data.documents && data.documents.length > 0) {
            const location = data.documents[0];
            return {
                lat: parseFloat(location.y),
                lng: parseFloat(location.x),
                address: location.address_name
            };
        }
        
        throw new Error('주소를 찾을 수 없습니다');
    } catch (error) {
        console.error('좌표 변환 오류:', error);
        return null;
    }
}

// 통합 요금 조회 함수
async function calculateKakaoQuickFareWithAPI(pickupAddress, dropoffAddress, width, length, height, weight) {
    // 차량 타입과 사이즈 결정
    const vehicleInfo = determineVehicleTypeAndSize(width, length, height, weight);
    
    if (!vehicleInfo) {
        return {
            success: false,
            error: '적합한 차량을 찾을 수 없습니다'
        };
    }

    // 주소를 좌표로 변환
    const [pickup, dropoff] = await Promise.all([
        getCoordinates(pickupAddress),
        getCoordinates(dropoffAddress)
    ]);

    if (!pickup || !dropoff) {
        return {
            success: false,
            error: '주소를 찾을 수 없습니다'
        };
    }

    // API를 통해 실시간 요금 조회
    const result = await getKakaoQuickFare(pickup, dropoff, vehicleInfo.orderType, vehicleInfo.size);
    
    if (result.success) {
        // 차량 타입 정보 추가
        result.data.vehicleType = vehicleInfo.vehicleType;
        result.data.estimated_fare = result.data.totalPrice || result.data.minimum;
    }
    
    return result;
}

// 차량 타입과 사이즈 결정 함수
function determineVehicleTypeAndSize(width, length, height, weight) {
    const totalSize = width + length + height;
    const dimensions = [width, length, height].sort((a, b) => b - a);
    
    // 사이즈 결정 (XS, S, M, L)
    let size;
    if (totalSize <= 60) {
        size = 'XS';
    } else if (totalSize <= 100) {
        size = 'S';
    } else if (totalSize <= 200) {
        size = 'M';
    } else {
        size = 'L';
    }
    
    // 차량 타입 결정
    if (weight <= 20 && totalSize <= 140) {
        return {
            orderType: 'QUICK',
            size: size,
            vehicleType: '퀵/바이크'
        };
    } else if (weight <= 450) {
        const damasLimits = [110, 160, 110].sort((a, b) => b - a);
        if (dimensions[0] <= damasLimits[0] && dimensions[1] <= damasLimits[1] && dimensions[2] <= damasLimits[2]) {
            return {
                orderType: 'QUICK',
                size: size,
                vehicleType: '다마스'
            };
        }
    }
    
    if (weight <= 500) {
        const laboLimits = [140, 220, 130].sort((a, b) => b - a);
        if (dimensions[0] <= laboLimits[0] && dimensions[1] <= laboLimits[1] && dimensions[2] <= laboLimits[2]) {
            return {
                orderType: 'QUICK',
                size: size,
                vehicleType: '라보'
            };
        }
    }
    
    if (weight <= 1000) {
        const truckLimits = [160, 280, 180].sort((a, b) => b - a);
        if (dimensions[0] <= truckLimits[0] && dimensions[1] <= truckLimits[1] && dimensions[2] <= truckLimits[2]) {
            return {
                orderType: 'QUICK',
                size: size,
                vehicleType: '1톤'
            };
        }
    }
    
    return null;
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getKakaoQuickFare,
        calculateKakaoQuickFareWithAPI,
        determineVehicleTypeAndSize,
        KAKAO_API_CONFIG
    };
}