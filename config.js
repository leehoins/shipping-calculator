// 배송 서비스 설정
const SHIPPING_CONFIG = {
    // 출발지 정보
    DEPARTURE_LOCATIONS: {
        gyeongdong: {
            name: "경동택배 - 성남 수정 고등배달센터",
            address: "경기도 성남시 수정구",
            service: "gyeongdong"
        },
        gangnam: {
            name: "카카오T 퀵 - 서울 강남구",
            address: "서울특별시 강남구 자곡로 7길 24 1층",
            service: "kakao"
        },
        gwangju: {
            name: "카카오T 퀵 - 경기도 광주시",
            address: "경기도 광주시 직동로 165",
            service: "kakao"
        }
    },
    
    // 카카오T 퀵 기본 요금 정보 (2024년 기준)
    KAKAO_QUICK_BASE_RATE: {
        // 기본료 (3km 기준)
        BASE_FEE: 5900,
        // km당 추가 요금 (3km 초과시)
        PER_KM_FEE: 1000,
        // 최소 요금
        MIN_FEE: 5900,
        // 무게별 할증
        WEIGHT_SURCHARGE: {
            20: 0,      // 20kg 이하
            30: 2000,   // 20-30kg
            40: 4000,   // 30-40kg
            50: 6000    // 40-50kg (최대 50kg)
        }
    }
};