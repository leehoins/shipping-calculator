// 카카오 모빌리티 길찾기 API를 활용한 정확한 거리 계산
const KAKAO_ROUTE_API = {
    REST_KEY: '65c0cdb0a66e605b8019d180de3e99d1', // 기존 REST API 키 사용
    
    // 도로 기준 실제 거리 계산
    async getRouteDistance(origin, destination) {
        try {
            // 좌표가 없으면 먼저 주소를 좌표로 변환
            if (!origin.lat || !origin.lng) {
                const coords = await getCoordinates(origin.address);
                if (coords) {
                    origin.lat = coords.lat;
                    origin.lng = coords.lng;
                }
            }
            
            if (!destination.lat || !destination.lng) {
                const coords = await getCoordinates(destination.address);
                if (coords) {
                    destination.lat = coords.lat;
                    destination.lng = coords.lng;
                }
            }
            
            // 카카오 모빌리티 API 호출
            const url = `https://apis-navi.kakaomobility.com/v1/directions`;
            const params = new URLSearchParams({
                origin: `${origin.lng},${origin.lat}`,
                destination: `${destination.lng},${destination.lat}`,
                priority: 'DISTANCE', // DISTANCE(최단거리) or TIME(최단시간)
                car_fuel: 'GASOLINE',
                car_hipass: false,
                alternatives: false
            });
            
            const response = await fetch(`${url}?${params}`, {
                headers: {
                    'Authorization': `KakaoAK ${this.REST_KEY}`
                }
            });
            
            if (!response.ok) {
                console.error('Route API 오류:', response.status);
                return null;
            }
            
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const distanceInMeters = route.summary.distance;
                const distanceInKm = Math.round(distanceInMeters / 1000);
                const duration = Math.round(route.summary.duration / 60); // 분 단위
                
                return {
                    distance: distanceInKm,
                    duration: duration,
                    exact: true // 정확한 도로 거리임을 표시
                };
            }
            
            return null;
        } catch (error) {
            console.error('Route API 에러:', error);
            return null;
        }
    },
    
    // 직선 거리 계산 (Haversine formula)
    calculateStraightDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 지구 반경 (km)
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // 직선거리에 도로 계수 적용 (평균적으로 도로거리는 직선거리의 1.3배)
        return Math.round(distance * 1.3);
    },
    
    toRad(deg) {
        return deg * (Math.PI/180);
    }
};

// 개선된 거리 계산 함수
async function getAccurateDistance(originAddress, destinationAddress) {
    try {
        // 1. 먼저 카카오 길찾기 API로 정확한 도로 거리 시도
        const routeResult = await KAKAO_ROUTE_API.getRouteDistance(
            { address: originAddress },
            { address: destinationAddress }
        );
        
        if (routeResult && routeResult.exact) {
            console.log(`정확한 도로 거리: ${routeResult.distance}km (소요시간: ${routeResult.duration}분)`);
            return routeResult.distance;
        }
        
        // 2. 길찾기 API 실패시 좌표 기반 직선거리 계산
        const [origin, dest] = await Promise.all([
            getCoordinates(originAddress),
            getCoordinates(destinationAddress)
        ]);
        
        if (origin && dest) {
            const straightDistance = KAKAO_ROUTE_API.calculateStraightDistance(
                origin.lat, origin.lng, dest.lat, dest.lng
            );
            console.log(`예상 거리 (직선거리 기반): ${straightDistance}km`);
            return straightDistance;
        }
        
        // 3. 모두 실패시 기존 거리 데이터 사용
        return null;
    } catch (error) {
        console.error('거리 계산 오류:', error);
        return null;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        KAKAO_ROUTE_API,
        getAccurateDistance
    };
}