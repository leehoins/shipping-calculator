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
        // 경동택배 공식 계산법
        // A운임: (가로+세로+높이) × 80원
        const totalSize = width + length + height;
        const aFee = totalSize * 80;
        
        // B운임: 중량(kg) × 200원
        const bFee = weight * 200;
        
        // A운임과 B운임 중 높은 것 선택
        let baseFee = Math.max(aFee, bFee);
        
        // 최저 운임 6,000원 적용
        baseFee = Math.max(baseFee, 6000);
        
        // 성남에서 출발하는 거리별 할증 적용 (평균 25%)
        baseFee = Math.round(baseFee * 1.25);
        
        // 도서 지역 할증 (3배)
        if (isIsland) {
            baseFee = baseFee * 3;
        }
        
        return baseFee;
    },
    
    // 카카오T 퀵 요금 계산 (차량 유형 자동 선택)
    calculateKakaoQuick: function(width, length, height, weight, distance) {
        // 적합한 차량 유형 선택
        const totalSize = width + length + height;
        let vehicleType = null;
        let vehicleName = '';
        
        // 차량 선택 로직
        if (weight <= 20 && totalSize <= 140) {
            vehicleType = SHIPPING_CONFIG.KAKAO_VEHICLE_TYPES.BIKE;
            vehicleName = vehicleType.name;
        } else if (weight <= 450 && width <= 110 && length <= 140 && height <= 160) {
            vehicleType = SHIPPING_CONFIG.KAKAO_VEHICLE_TYPES.DAMAS;
            vehicleName = vehicleType.name;
        } else if (weight <= 500 && width <= 160 && length <= 220 && height <= 280) {
            vehicleType = SHIPPING_CONFIG.KAKAO_VEHICLE_TYPES.LABO;
            vehicleName = vehicleType.name;
        } else if (weight <= 1000 && width <= 110 && length <= 130 && height <= 180) {
            vehicleType = SHIPPING_CONFIG.KAKAO_VEHICLE_TYPES.TRUCK_1T;
            vehicleName = vehicleType.name;
        } else {
            return {
                error: "카카오T 퀵 서비스 이용 불가 (크기/중량 초과)",
                fee: 0,
                distance: 0,
                vehicleType: "없음"
            };
        }
        
        // 2025년 카카오T 퀵 요금 체계
        let baseFee = 0;
        if (vehicleType.name === "퀵/바이크") {
            // 바이크: 3km까지 5,900원, 이후 km당 1,000원
            if (distance <= 3) {
                baseFee = 5900;
            } else {
                baseFee = 5900 + Math.ceil(distance - 3) * 1000;
            }
        } else if (vehicleType.name === "다마스") {
            // 다마스: 5km까지 19,000원, 이후 km당 1,500원
            if (distance <= 5) {
                baseFee = 19000;
            } else {
                baseFee = 19000 + Math.ceil(distance - 5) * 1500;
            }
        } else if (vehicleType.name === "라보") {
            // 라보: 5km까지 24,000원, 이후 km당 2,000원
            if (distance <= 5) {
                baseFee = 24000;
            } else {
                baseFee = 24000 + Math.ceil(distance - 5) * 2000;
            }
        } else if (vehicleType.name === "1톤") {
            // 1톤: 5km까지 35,000원, 이후 km당 2,500원
            if (distance <= 5) {
                baseFee = 35000;
            } else {
                baseFee = 35000 + Math.ceil(distance - 5) * 2500;
            }
        }
        
        return {
            fee: Math.round(baseFee),
            distance: distance.toFixed(1),
            vehicleType: vehicleName
        };
    },
    
    // 거리 계산 (출발지별)
    estimateDistance: function(departure, destination) {
        // 더 정확한 거리 추정 로직
        if (departure === 'gangnam') {
            // 서울 강남구에서 출발
            if (destination.includes('강남')) {
                return 5; // 강남구 내
            } else if (destination.includes('서울')) {
                return 15; // 서울 내 다른 지역
            } else if (destination.includes('성남') || destination.includes('분당')) {
                return 20; // 인접 지역
            } else if (destination.includes('경기')) {
                if (destination.includes('화성') || destination.includes('용인') || destination.includes('수원')) {
                    return 40; // 경기 남부
                } else if (destination.includes('광주') || destination.includes('이천')) {
                    return 50; // 경기 동남부
                } else {
                    return 30; // 경기 기타
                }
            } else if (destination.includes('인천')) {
                return 40;
            } else if (destination.includes('제주')) {
                return 60; // 제주도 (항공/선박)
            } else {
                return 35; // 기타 지역
            }
        } else if (departure === 'gwangju') {
            // 경기도 광주시에서 출발
            if (destination.includes('광주') && destination.includes('경기')) {
                return 5; // 광주시 내
            } else if (destination.includes('성남') || destination.includes('용인')) {
                return 25; // 인접 지역
            } else if (destination.includes('화성')) {
                return 35; // 화성시까지
            } else if (destination.includes('수원')) {
                return 30; // 수원시까지
            } else if (destination.includes('서울')) {
                if (destination.includes('강남') || destination.includes('송파')) {
                    return 35; // 서울 동남부
                } else {
                    return 40; // 서울 기타
                }
            } else if (destination.includes('경기')) {
                return 30; // 경기 기타
            } else if (destination.includes('인천')) {
                return 50;
            } else if (destination.includes('제주')) {
                return 60; // 제주도
            } else {
                return 40; // 기타 지역
            }
        }
        
        return 30; // 기본값
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

    // 다음 우편번호 서비스를 이용한 주소 검색
    if (elements.addressSearchBtn) {
        elements.addressSearchBtn.addEventListener('click', function() {
            // daum.Postcode이 로드되었는지 확인
            if (typeof daum === 'undefined' || typeof daum.Postcode === 'undefined') {
                alert('주소 검색 서비스를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }
        
        // 기존에 입력된 주소값 저장
        const currentAddressValue = elements.address.value.trim();
        
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
            },
            // 사용자가 팝업을 닫았을 때
            onclose: function(state) {
                // state가 COMPLETE가 아니면 (즉, 주소를 선택하지 않고 닫았으면)
                // 기존 입력값이 있고 새로운 주소를 선택하지 않았다면 기존값 유지
                if(state !== 'COMPLETE' && currentAddressValue && !elements.address.value) {
                    elements.address.value = currentAddressValue;
                }
            },
            // 검색어 자동 입력 옵션
            autoMapping: currentAddressValue ? true : false,
            shorthand: currentAddressValue ? true : false
        }).open({
            // 입력된 주소가 있으면 검색어로 사용
            q: currentAddressValue
        });
        });
    }

    // 배송비 계산 함수
    function calculateShipping() {
        // 입력값 가져오기
        const address = elements.address.value.trim();
        const detailAddress = elements.detailAddress.value.trim();
        const fullAddress = detailAddress ? `${address} ${detailAddress}` : address;
        // mm를 cm로 변환
        const widthMm = parseFloat(elements.width.value) || 0;
        const lengthMm = parseFloat(elements.length.value) || 0;
        const heightMm = parseFloat(elements.height.value) || 0;
        const width = widthMm / 10; // mm to cm
        const length = lengthMm / 10; // mm to cm
        const height = heightMm / 10; // mm to cm
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
        
        // 지역 판별
        const isJeju = fullAddress.includes('제주');
        const isIsland = fullAddress.includes('도서') || fullAddress.includes('울릉') || fullAddress.includes('거제');
        
        // 마크업 계산 함수
        const calculateWithMarkup = (base) => {
            if (typeof base === 'number') {
                const markup = Math.round(base * markupPercent / 100);
                const total = base + markup;
                return { base, markup, total };
            }
            return null;
        };
        
        // 우체국 택배 계산
        const postOfficeBase = shippingCalculator.calculatePostOffice(width, length, height, weight, isJeju);
        if (typeof postOfficeBase === 'number') {
            const result = calculateWithMarkup(postOfficeBase);
            document.getElementById('postOfficeBase').textContent = formatCurrency(result.base);
            document.getElementById('postOfficeMarkup').textContent = formatCurrency(result.markup);
            document.getElementById('postOfficeTotal').textContent = formatCurrency(result.total);
            document.getElementById('postOfficeMarkupPercent').textContent = markupPercent;
            document.getElementById('postOfficeCard').classList.remove('disabled');
        } else {
            document.getElementById('postOfficeBase').textContent = postOfficeBase.error;
            document.getElementById('postOfficeMarkup').textContent = '-';
            document.getElementById('postOfficeTotal').textContent = '-';
            document.getElementById('postOfficeCard').classList.add('disabled');
        }
        
        // 경동택배 화물 계산
        const gyeongdongBase = shippingCalculator.calculateGyeongdong(width, length, height, weight, isIsland);
        const gyeongdongResult = calculateWithMarkup(gyeongdongBase);
        document.getElementById('gyeongdongBase').textContent = formatCurrency(gyeongdongResult.base);
        document.getElementById('gyeongdongMarkup').textContent = formatCurrency(gyeongdongResult.markup);
        document.getElementById('gyeongdongTotal').textContent = formatCurrency(gyeongdongResult.total);
        document.getElementById('gyeongdongMarkupPercent').textContent = markupPercent;
        
        // 카카오T 퀵 - 강남 출발
        const gangnamDistance = shippingCalculator.estimateDistance('gangnam', fullAddress);
        console.log('강남 출발 거리:', gangnamDistance, 'km, 주소:', fullAddress);
        const kakaoGangnamResult = shippingCalculator.calculateKakaoQuick(width, length, height, weight, gangnamDistance);
        if (!kakaoGangnamResult.error) {
            const result = calculateWithMarkup(kakaoGangnamResult.fee);
            document.getElementById('kakaoGangnamBase').textContent = formatCurrency(result.base);
            document.getElementById('kakaoGangnamMarkup').textContent = formatCurrency(result.markup);
            document.getElementById('kakaoGangnamTotal').textContent = formatCurrency(result.total);
            document.getElementById('kakaoGangnamMarkupPercent').textContent = markupPercent;
            document.getElementById('kakaoGangnamDistance').textContent = `약 ${kakaoGangnamResult.distance}km`;
            // 차량 유형 표시를 위한 요소 찾기 또는 생성
            let vehicleTypeElement = document.getElementById('kakaoGangnamVehicleType');
            if (!vehicleTypeElement) {
                const vehicleRow = document.createElement('div');
                vehicleRow.className = 'price-row';
                vehicleRow.style.cssText = 'font-size: 14px; color: #666; margin-top: 5px;';
                vehicleRow.innerHTML = '<span>차량 유형:</span> <span id="kakaoGangnamVehicleType" style="font-weight: bold; color: #3498db;"></span>';
                document.getElementById('kakaoGangnamCard').querySelector('.price-detail').appendChild(vehicleRow);
                vehicleTypeElement = document.getElementById('kakaoGangnamVehicleType');
            }
            vehicleTypeElement.textContent = kakaoGangnamResult.vehicleType;
            document.getElementById('kakaoGangnamCard').classList.remove('disabled');
        } else {
            document.getElementById('kakaoGangnamBase').textContent = kakaoGangnamResult.error;
            document.getElementById('kakaoGangnamMarkup').textContent = '-';
            document.getElementById('kakaoGangnamTotal').textContent = '-';
            document.getElementById('kakaoGangnamDistance').textContent = '-';
            document.getElementById('kakaoGangnamCard').classList.add('disabled');
        }
        
        // 카카오T 퀵 - 광주 출발
        const gwangjuDistance = shippingCalculator.estimateDistance('gwangju', fullAddress);
        console.log('광주 출발 거리:', gwangjuDistance, 'km, 주소:', fullAddress);
        const kakaoGwangjuResult = shippingCalculator.calculateKakaoQuick(width, length, height, weight, gwangjuDistance);
        if (!kakaoGwangjuResult.error) {
            const result = calculateWithMarkup(kakaoGwangjuResult.fee);
            document.getElementById('kakaoGwangjuBase').textContent = formatCurrency(result.base);
            document.getElementById('kakaoGwangjuMarkup').textContent = formatCurrency(result.markup);
            document.getElementById('kakaoGwangjuTotal').textContent = formatCurrency(result.total);
            document.getElementById('kakaoGwangjuMarkupPercent').textContent = markupPercent;
            document.getElementById('kakaoGwangjuDistance').textContent = `약 ${kakaoGwangjuResult.distance}km`;
            // 차량 유형 표시를 위한 요소 찾기 또는 생성
            let vehicleTypeElement2 = document.getElementById('kakaoGwangjuVehicleType');
            if (!vehicleTypeElement2) {
                const vehicleRow2 = document.createElement('div');
                vehicleRow2.className = 'price-row';
                vehicleRow2.style.cssText = 'font-size: 14px; color: #666; margin-top: 5px;';
                vehicleRow2.innerHTML = '<span>차량 유형:</span> <span id="kakaoGwangjuVehicleType" style="font-weight: bold; color: #3498db;"></span>';
                document.getElementById('kakaoGwangjuCard').querySelector('.price-detail').appendChild(vehicleRow2);
                vehicleTypeElement2 = document.getElementById('kakaoGwangjuVehicleType');
            }
            vehicleTypeElement2.textContent = kakaoGwangjuResult.vehicleType;
            document.getElementById('kakaoGwangjuCard').classList.remove('disabled');
        } else {
            document.getElementById('kakaoGwangjuBase').textContent = kakaoGwangjuResult.error;
            document.getElementById('kakaoGwangjuMarkup').textContent = '-';
            document.getElementById('kakaoGwangjuTotal').textContent = '-';
            document.getElementById('kakaoGwangjuDistance').textContent = '-';
            document.getElementById('kakaoGwangjuCard').classList.add('disabled');
        }
        
        // 계산 기준 정보 표시
        document.getElementById('destination').textContent = fullAddress || address;
        document.getElementById('totalSize').textContent = (widthMm + lengthMm + heightMm).toFixed(0);
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
});