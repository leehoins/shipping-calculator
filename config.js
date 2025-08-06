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
    
    // 카카오T 퀵 차량 유형별 정보
    KAKAO_VEHICLE_TYPES: {
        BIKE: {
            name: "퀵/바이크",
            maxSize: 140, // 가로+세로+높이 합계 cm
            maxWeight: 20, // kg
            baseFee: 2000, // 배상한도 2000만원
            perKmFee: 50
        },
        BIKE_LARGE: {
            name: "방문 택배",
            maxSize: 140,
            maxWeight: 15,
            baseFee: 50, // 배상한도 50만원
            perKmFee: 50
        },
        DAMAS: {
            name: "다마스",
            maxSize: {
                width: 110,
                length: 160,
                height: 110
            },
            maxWeight: 450,
            baseFee: 2000,
            perKmFee: 100
        },
        LABO: {
            name: "라보",
            maxSize: {
                width: 140,
                length: 220,
                height: 130
            },
            maxWeight: 500,
            baseFee: 2000,
            perKmFee: 150
        },
        TRUCK_1T: {
            name: "1톤",
            maxSize: {
                width: 160,
                length: 280,
                height: 180
            },
            maxWeight: 1000,
            baseFee: 2000,
            perKmFee: 200
        }
    }
};