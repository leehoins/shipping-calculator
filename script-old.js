// 배송비 계산 로직
const shippingCalculator = {
    // 우체국 택배 요금 계산
    calculatePostOffice: function(width, length, height, weight, isJeju = false) {
        const totalSize = width + length + height;
        
        // 크기 제한 체크
        if (totalSize > 160 || Math.max(width, length, height) > 100) {
            return { error: "우체국 택배 크기 제한을 초과했습니다. (합 160cm 이하, 한 변 100cm 이하)" };
        }
        
        if (weight > 30) {
            return { error: "우체국 택배 중량 제한을 초과했습니다. (30kg 이하)" };
        }
        
        // 크기별 요금 (기본 요금 설정)
        let sizeFee = 0;
        if (totalSize <= 60) {
            sizeFee = 4000;
        } else if (totalSize <= 80) {
            sizeFee = 5000;
        } else if (totalSize <= 100) {
            sizeFee = 6000;
        } else if (totalSize <= 120) {
            sizeFee = 7000;
        } else if (totalSize <= 140) {
            sizeFee = 8000;
        } else {
            sizeFee = 9000;
        }
        
        // 중량별 요금
        let weightFee = 0;
        if (weight <= 2) {
            weightFee = 4000;
        } else if (weight <= 5) {
            weightFee = 5000;
        } else if (weight <= 10) {
            weightFee = 6000;
        } else if (weight <= 20) {
            weightFee = 8000;
        } else {
            weightFee = 10000;
        }
        
        // 크기와 중량 중 높은 요금 적용
        let baseFee = Math.max(sizeFee, weightFee);
        
        // 제주 지역 할증 (약 50%)
        if (isJeju) {
            baseFee = Math.round(baseFee * 1.5);
        }
        
        return baseFee;
    },
    
    // 경동택배 화물 요금 계산
    calculateGyeongdong: function(width, length, height, weight, isIsland = false) {
        // 부피 계산 (cm³)
        const volume = width * length * height;
        
        // 부피 기준 요금 (정기화물 기준)
        let volumeFee = 0;
        if (volume <= 20000) {
            volumeFee = 1600;
        } else if (volume <= 30000) {
            volumeFee = 2000;
        } else if (volume <= 40000) {
            volumeFee = 2400;
        } else if (volume <= 50000) {
            volumeFee = 2800;
        } else if (volume <= 60000) {
            volumeFee = 3200;
        } else if (volume <= 80000) {
            volumeFee = 3600;
        } else if (volume <= 100000) {
            volumeFee = 4000;
        } else if (volume <= 120000) {
            volumeFee = 4400;
        } else if (volume <= 150000) {
            volumeFee = 4800;
        } else if (volume <= 200000) {
            volumeFee = 5600;
        } else if (volume <= 250000) {
            volumeFee = 6400;
        } else if (volume <= 300000) {
            volumeFee = 7200;
        } else if (volume <= 400000) {
            volumeFee = 8000;
        } else if (volume <= 500000) {
            volumeFee = 8800;
        } else {
            // 500,000㎤ 초과 시 비례 계산
            volumeFee = Math.round(8800 + (volume - 500000) / 100000 * 800);
        }
        
        // 무게 기준 요금 (정기화물 기준)
        let weightFee = 0;
        if (weight <= 6) {
            weightFee = 1600;
        } else if (weight <= 7) {
            weightFee = 1900;
        } else if (weight <= 8) {
            weightFee = 2200;
        } else if (weight <= 9) {
            weightFee = 2500;
        } else if (weight <= 10) {
            weightFee = 2800;
        } else if (weight <= 12) {
            weightFee = 3100;
        } else if (weight <= 15) {
            weightFee = 3400;
        } else if (weight <= 20) {
            weightFee = 4000;
        } else if (weight <= 25) {
            weightFee = 4600;
        } else if (weight <= 30) {
            weightFee = 5200;
        } else if (weight <= 40) {
            weightFee = 6400;
        } else if (weight <= 50) {
            weightFee = 7600;
        } else {
            // 50kg 초과 시 비례 계산
            weightFee = Math.round(7600 + (weight - 50) / 10 * 1200);
        }
        
        // 부피와 무게 중 높은 요금 적용
        let baseFee = Math.max(volumeFee, weightFee);
        
        // 성남에서 출발하는 거리별 할증 적용 (평균 25%)
        baseFee = Math.round(baseFee * 1.25);
        
        // 도서 지역 할증 (3배)
        if (isIsland) {
            baseFee = baseFee * 3;
        }
        
        return baseFee;
    },
    
    // 카카오T 퀵 요금 계산
    calculateKakaoQuick: function(distance, weight) {
        // 중량 제한 체크 (50kg 초과 불가)
        if (weight > 50) {
            return {
                error: "카카오T 퀵 중량 제한을 초과했습니다. (50kg 이하)",
                fee: 0,
                distance: 0
            };
        }
        
        // 기본 요금 (3km 포함)
        let baseFee = SHIPPING_CONFIG.KAKAO_QUICK_BASE_RATE.BASE_FEE;
        
        // 거리별 추가 요금 (3km 초과분만)
        let distanceFee = 0;
        if (distance > 3) {
            distanceFee = Math.ceil(distance - 3) * SHIPPING_CONFIG.KAKAO_QUICK_BASE_RATE.PER_KM_FEE;
        }
        
        // 무게별 할증
        let weightSurcharge = 0;
        if (weight > 40) {
            weightSurcharge = SHIPPING_CONFIG.KAKAO_QUICK_BASE_RATE.WEIGHT_SURCHARGE[50];
        } else if (weight > 30) {
            weightSurcharge = SHIPPING_CONFIG.KAKAO_QUICK_BASE_RATE.WEIGHT_SURCHARGE[40];
        } else if (weight > 20) {
            weightSurcharge = SHIPPING_CONFIG.KAKAO_QUICK_BASE_RATE.WEIGHT_SURCHARGE[30];
        }
        
        // 총 요금 계산
        let totalFee = baseFee + distanceFee + weightSurcharge;
        
        // 최소 요금 적용
        totalFee = Math.max(totalFee, SHIPPING_CONFIG.KAKAO_QUICK_BASE_RATE.MIN_FEE);
        
        return {
            fee: Math.round(totalFee),
            distance: distance.toFixed(1)
        };
    }
};

// 숫자 포맷팅 함수
function formatCurrency(amount) {
    return '₩' + amount.toLocaleString('ko-KR');
}

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소들
    const elements = {
        departure: document.getElementById('departure'),
        address: document.getElementById('address'),
        detailAddress: document.getElementById('detailAddress'),
        addressSearchBtn: document.getElementById('addressSearchBtn'),
        width: document.getElementById('width'),
        length: document.getElementById('length'),
        height: document.getElementById('height'),
        weight: document.getElementById('weight'),
        markupSlider: document.getElementById('markupSlider'),
        markupInput: document.getElementById('markupInput'),
        calculateBtn: document.getElementById('calculateBtn'),
        resultSection: document.getElementById('resultSection')
    };

    // 마크업 슬라이더와 입력 필드 동기화
    elements.markupSlider.addEventListener('input', function() {
        elements.markupInput.value = this.value;
    });

    elements.markupInput.addEventListener('input', function() {
        elements.markupSlider.value = this.value;
    });
    
    // 출발지 선택에 따른 탭 표시/숨김
    function updateServiceTabs() {
        const selectedDeparture = elements.departure.value;
        const departureInfo = SHIPPING_CONFIG.DEPARTURE_LOCATIONS[selectedDeparture];
        
        const postOfficeTab = document.querySelector('[data-tab="postOffice"]');
        const gyeongdongTab = document.querySelector('[data-tab="gyeongdong"]');
        const kakaoTab = document.querySelector('[data-tab="kakaoQuick"]');
        
        // 모든 탭 숨김
        postOfficeTab.style.display = 'none';
        gyeongdongTab.style.display = 'none';
        kakaoTab.style.display = 'none';
        
        // 선택된 서비스만 표시
        if (departureInfo.service === 'gyeongdong') {
            postOfficeTab.style.display = 'inline-block';
            gyeongdongTab.style.display = 'inline-block';
            // 경동택배 선택시 첫번째 탭 활성화
            if (!postOfficeTab.classList.contains('active') && !gyeongdongTab.classList.contains('active')) {
                postOfficeTab.click();
            }
        } else if (departureInfo.service === 'kakao') {
            kakaoTab.style.display = 'inline-block';
            // 카카오T 퀵 선택시 해당 탭 활성화
            kakaoTab.click();
        }
    }
    
    // 출발지 변경 이벤트
    elements.departure.addEventListener('change', updateServiceTabs);
    
    // 초기 탭 설정
    updateServiceTabs();

    // 다음 우편번호 서비스를 이용한 주소 검색
    elements.addressSearchBtn.addEventListener('click', function() {
        // daum.Postcode이 로드되었는지 확인
        if (typeof daum === 'undefined' || typeof daum.Postcode === 'undefined') {
            alert('주소 검색 서비스를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        new daum.Postcode({
            oncomplete: function(data) {
                // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분
                let fullAddress = data.address; // 최종 주소 변수
                let extraAddress = ''; // 참고항목 변수

                // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                    extraAddress += data.bname;
                }
                // 건물명이 있고, 공동주택일 경우 추가한다.
                if(data.buildingName !== '' && data.apartment === 'Y'){
                    extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                if(extraAddress !== ''){
                    extraAddress = ' (' + extraAddress + ')';
                }

                // 우편번호와 주소 정보를 해당 필드에 넣는다.
                elements.address.value = fullAddress + extraAddress;
                
                // 상세주소 입력 필드 표시 및 포커스
                elements.detailAddress.style.display = 'block';
                elements.detailAddress.focus();
            }
        }).open();
    });

    // 탭 기능
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // 모든 탭 비활성화
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 선택된 탭 활성화
            button.classList.add('active');
            document.getElementById(targetTab + 'Tab').classList.add('active');
        });
    });

    // 배송비 계산 함수
    function calculateShipping() {
        // 입력값 가져오기
        const address = elements.address.value.trim();
        const detailAddress = elements.detailAddress.value.trim();
        const fullAddress = detailAddress ? `${address} ${detailAddress}` : address;
        const width = parseFloat(elements.width.value) || 0;
        const length = parseFloat(elements.length.value) || 0;
        const height = parseFloat(elements.height.value) || 0;
        const weight = parseFloat(elements.weight.value) || 0;
        const markupPercent = parseFloat(elements.markupInput.value) || 0;
        
        // 입력값 검증
        if (!address) {
            alert('배송 주소를 입력해주세요.');
            return;
        }
        
        if (width <= 0 || length <= 0 || height <= 0) {
            alert('가로, 세로, 높이를 모두 입력해주세요.');
            return;
        }
        
        if (weight <= 0) {
            alert('중량을 입력해주세요.');
            return;
        }
        
        // 출발지 정보 가져오기
        const selectedDeparture = elements.departure.value;
        const departureInfo = SHIPPING_CONFIG.DEPARTURE_LOCATIONS[selectedDeparture];
        
        // 지역 판별 (간단한 키워드 기반)
        const isJeju = fullAddress.includes('제주');
        const isIsland = fullAddress.includes('도서') || fullAddress.includes('울릉') || fullAddress.includes('거제');
        
        // 거리 계산을 위한 예상값 설정
        let estimatedDistance = 10; // 기본값
        
        // 출발지와 도착지에 따른 거리 예상
        if (departureInfo.service === 'kakao') {
            if (selectedDeparture === 'gangnam' && fullAddress.includes('강남')) {
                estimatedDistance = 5; // 강남 내 배송
            } else if (selectedDeparture === 'gwangju' && fullAddress.includes('광주')) {
                estimatedDistance = 5; // 광주 내 배송
            } else if (fullAddress.includes('서울')) {
                estimatedDistance = selectedDeparture === 'gangnam' ? 10 : 30; // 서울 내/서울까지
            } else if (fullAddress.includes('경기')) {
                estimatedDistance = selectedDeparture === 'gwangju' ? 10 : 25; // 경기 내/경기까지
            } else if (isJeju) {
                estimatedDistance = 50; // 제주도
            } else {
                estimatedDistance = 20; // 기타 지역
            }
        }
        
        // 각 택배사별 기본 요금 계산
        const postOfficeBase = shippingCalculator.calculatePostOffice(width, length, height, weight, isJeju);
        const gyeongdongBase = shippingCalculator.calculateGyeongdong(width, length, height, weight, isIsland);
        const kakaoQuickResult = shippingCalculator.calculateKakaoQuick(estimatedDistance, weight);
        
        // 마크업 계산
        const calculateWithMarkup = (base) => {
            if (typeof base === 'number') {
                const markup = Math.round(base * markupPercent / 100);
                const total = base + markup;
                return { base, markup, total };
            }
            return null;
        };
        
        // 우체국 택배 결과 표시
        if (typeof postOfficeBase === 'number') {
            const postOfficeResult = calculateWithMarkup(postOfficeBase);
            document.getElementById('postOfficeBase').textContent = formatCurrency(postOfficeResult.base);
            document.getElementById('postOfficeMarkup').textContent = formatCurrency(postOfficeResult.markup);
            document.getElementById('postOfficeTotal').textContent = formatCurrency(postOfficeResult.total);
            document.getElementById('postOfficeMarkupPercent').textContent = markupPercent;
        } else {
            document.getElementById('postOfficeBase').textContent = postOfficeBase.error;
            document.getElementById('postOfficeMarkup').textContent = '-';
            document.getElementById('postOfficeTotal').textContent = '-';
        }
        
        // 경동택배 화물 결과 표시
        const gyeongdongResult = calculateWithMarkup(gyeongdongBase);
        document.getElementById('gyeongdongBase').textContent = formatCurrency(gyeongdongResult.base);
        document.getElementById('gyeongdongMarkup').textContent = formatCurrency(gyeongdongResult.markup);
        document.getElementById('gyeongdongTotal').textContent = formatCurrency(gyeongdongResult.total);
        document.getElementById('gyeongdongMarkupPercent').textContent = markupPercent;
        
        // 카카오T 퀵 결과 표시
        if (kakaoQuickResult.error) {
            document.getElementById('kakaoQuickBase').textContent = kakaoQuickResult.error;
            document.getElementById('kakaoQuickMarkup').textContent = '-';
            document.getElementById('kakaoQuickTotal').textContent = '-';
            document.getElementById('estimatedDistance').textContent = '-';
        } else {
            const kakaoQuickBase = kakaoQuickResult.fee;
            const kakaoQuickMarkupResult = calculateWithMarkup(kakaoQuickBase);
            document.getElementById('kakaoQuickBase').textContent = formatCurrency(kakaoQuickMarkupResult.base);
            document.getElementById('kakaoQuickMarkup').textContent = formatCurrency(kakaoQuickMarkupResult.markup);
            document.getElementById('kakaoQuickTotal').textContent = formatCurrency(kakaoQuickMarkupResult.total);
            document.getElementById('kakaoQuickMarkupPercent').textContent = markupPercent;
            document.getElementById('estimatedDistance').textContent = `약 ${kakaoQuickResult.distance}km`;
        }
        
        // 계산 기준 정보 표시
        document.getElementById('origin').textContent = departureInfo.name;
        document.getElementById('destination').textContent = fullAddress || address;
        document.getElementById('totalSize').textContent = (width + length + height).toFixed(1);
        document.getElementById('totalWeight').textContent = weight.toFixed(1);
        
        // 결과 섹션 표시
        elements.resultSection.style.display = 'block';
        elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 계산 버튼 클릭 이벤트
    elements.calculateBtn.addEventListener('click', calculateShipping);

    // 엔터키로 계산 실행
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            calculateShipping();
        }
    });
}); // DOMContentLoaded 종료