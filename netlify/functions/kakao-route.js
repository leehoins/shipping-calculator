const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event, context) => {
    // CORS 헤더 설정
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS 요청 처리
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // POST 요청만 허용
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { origin, destination } = JSON.parse(event.body);
        
        if (!origin || !destination) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Origin and destination are required' })
            };
        }

        // 카카오 모빌리티 API 호출
        const url = 'https://apis-navi.kakaomobility.com/v1/directions';
        const params = new URLSearchParams({
            origin: `${origin.lng},${origin.lat}`,
            destination: `${destination.lng},${destination.lat}`,
            priority: 'DISTANCE',
            car_fuel: 'GASOLINE',
            car_hipass: false,
            alternatives: false
        });

        const response = await fetch(`${url}?${params}`, {
            headers: {
                'Authorization': 'KakaoAK 65c0cdb0a66e605b8019d180de3e99d1'
            }
        });

        if (!response.ok) {
            console.error('Route API error:', response.status);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: 'Route API request failed',
                    status: response.status,
                    details: errorText
                })
            };
        }

        const data = await response.json();
        console.log('Kakao Route API response structure:', {
            hasRoutes: !!data.routes,
            routesLength: data.routes ? data.routes.length : 0,
            firstRoute: data.routes && data.routes[0] ? Object.keys(data.routes[0]) : []
        });
        
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // summary가 있는지 확인
            if (route.summary) {
                const distanceInMeters = route.summary.distance;
                const distanceInKm = Math.round(distanceInMeters / 1000);
                const duration = Math.round(route.summary.duration / 60);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        distance: distanceInKm,
                        duration: duration,
                        exact: true
                    })
                };
            } else {
                // summary가 없는 경우 다른 필드 체크
                const sections = route.sections || [];
                if (sections.length > 0) {
                    const totalDistance = sections.reduce((sum, section) => sum + (section.distance || 0), 0);
                    const totalDuration = sections.reduce((sum, section) => sum + (section.duration || 0), 0);
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            distance: Math.round(totalDistance / 1000),
                            duration: Math.round(totalDuration / 60),
                            exact: true
                        })
                    };
                }
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                error: 'No route found'
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};