// 카카오T 퀵 설정 (API 키 없이 요금 계산만)
const KAKAO_CONFIG = {
    // 카카오T 퀵 기본 요금 정보 (2024년 기준)
    // 실제 카카오T 퀵 도보배송 요금 체계 반영
    QUICK_BASE_RATE: {
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