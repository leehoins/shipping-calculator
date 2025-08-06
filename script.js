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
        
        // 차량 선택 로직 - 짐을 돌려서 넣을 수 있으므로 모든 방향 고려
        const dimensions = [width, length, height].sort((a, b) => b - a); // 큰 값부터 정렬
        
        if (weight <= 20 && totalSize <= 140) {
            vehicleType = SHIPPING_CONFIG.KAKAO_VEHICLE_TYPES.BIKE;
            vehicleName = vehicleType.name;
        } else if (weight <= 450) {
            // 다마스: 110x160x110cm - 어떤 방향으로든 들어가는지 확인
            const damasLimits = [110, 160, 110].sort((a, b) => b - a);
            if (dimensions[0] <= damasLimits[0] && dimensions[1] <= damasLimits[1] && dimensions[2] <= damasLimits[2]) {
                vehicleType = SHIPPING_CONFIG.KAKAO_VEHICLE_TYPES.DAMAS;
                vehicleName = vehicleType.name;
            }
        }
        
        if (!vehicleType && weight <= 500) {
            // 라보: 140x220x130cm - 어떤 방향으로든 들어가는지 확인
            const laboLimits = [140, 220, 130].sort((a, b) => b - a);
            if (dimensions[0] <= laboLimits[0] && dimensions[1] <= laboLimits[1] && dimensions[2] <= laboLimits[2]) {
                vehicleType = SHIPPING_CONFIG.KAKAO_VEHICLE_TYPES.LABO;
                vehicleName = vehicleType.name;
            }
        }
        
        if (!vehicleType && weight <= 1000) {
            // 1톤: 160x280x180cm - 어떤 방향으로든 들어가는지 확인
            const truckLimits = [160, 280, 180].sort((a, b) => b - a);
            if (dimensions[0] <= truckLimits[0] && dimensions[1] <= truckLimits[1] && dimensions[2] <= truckLimits[2]) {
                vehicleType = SHIPPING_CONFIG.KAKAO_VEHICLE_TYPES.TRUCK_1T;
                vehicleName = vehicleType.name;
            }
        }
        
        if (!vehicleType) {
            return {
                error: "카카오T 퀵 서비스 이용 불가 (크기/중량 초과)",
                fee: 0,
                distance: 0,
                vehicleType: "서비스 불가"
            };
        }
        
        // 2025년 카카오T 퀵 요금 체계
        let baseFee = 0;
        let priceDetail = '';
        
        if (vehicleType.name === "퀵/바이크") {
            // 바이크: 3km까지 5,900원, 이후 km당 1,000원
            if (distance <= 3) {
                baseFee = 5900;
                priceDetail = "기본 3km: ₩5,900";
            } else {
                const extraKm = Math.ceil(distance - 3);
                baseFee = 5900 + extraKm * 1000;
                priceDetail = `기본 3km: ₩5,900 + 추가 ${extraKm}km × ₩1,000`;
            }
        } else if (vehicleType.name === "다마스") {
            // 다마스: 5km까지 19,000원, 이후 km당 1,500원
            if (distance <= 5) {
                baseFee = 19000;
                priceDetail = "기본 5km: ₩19,000";
            } else {
                const extraKm = Math.ceil(distance - 5);
                baseFee = 19000 + extraKm * 1500;
                priceDetail = `기본 5km: ₩19,000 + 추가 ${extraKm}km × ₩1,500`;
            }
        } else if (vehicleType.name === "라보") {
            // 라보: 5km까지 24,000원, 이후 km당 2,000원
            if (distance <= 5) {
                baseFee = 24000;
                priceDetail = "기본 5km: ₩24,000";
            } else {
                const extraKm = Math.ceil(distance - 5);
                baseFee = 24000 + extraKm * 2000;
                priceDetail = `기본 5km: ₩24,000 + 추가 ${extraKm}km × ₩2,000`;
            }
        } else if (vehicleType.name === "1톤") {
            // 1톤: 5km까지 35,000원, 이후 km당 2,500원
            if (distance <= 5) {
                baseFee = 35000;
                priceDetail = "기본 5km: ₩35,000";
            } else {
                const extraKm = Math.ceil(distance - 5);
                baseFee = 35000 + extraKm * 2500;
                priceDetail = `기본 5km: ₩35,000 + 추가 ${extraKm}km × ₩2,500`;
            }
        }
        
        return {
            fee: Math.round(baseFee),
            distance: distance.toFixed(1),
            vehicleType: vehicleName,
            priceDetail: priceDetail
        };
    },
    
    // 거리 계산 (출발지별)
    estimateDistance: function(departure, destination) {
        // 주소를 소문자로 변환하여 대소문자 구분 없이 매칭
        const dest = destination.toLowerCase();
        console.log('거리 계산 - 목적지:', dest);
        
        // 거리 데이터 선택
        const distanceMap = departure === 'gangnam' ? DISTANCE_DATA.fromGangnam : DISTANCE_DATA.fromGwangju;
        
        // 주소에서 지역명 추출 및 매칭
        for (const [location, distance] of Object.entries(distanceMap)) {
            if (dest.includes(location.toLowerCase())) {
                console.log(`매칭된 지역: ${location}, 거리: ${distance}km`);
                return distance;
            }
        }
        
        // 시/군/구 단위로 재시도
        const addressParts = dest.split(' ');
        for (const part of addressParts) {
            for (const [location, distance] of Object.entries(distanceMap)) {
                if (location.toLowerCase().includes(part) || part.includes(location.toLowerCase())) {
                    console.log(`부분 매칭된 지역: ${location}, 거리: ${distance}km`);
                    return distance;
                }
            }
        }
        
        // 광역 지역명으로 매칭 시도
        const regionPatterns = {
            '서울': 15,
            '경기': 30,
            '인천': departure === 'gangnam' ? 40 : 55,
            '강원': departure === 'gangnam' ? 150 : 130,
            '충북': departure === 'gangnam' ? 140 : 120,
            '충남': departure === 'gangnam' ? 120 : 110,
            '대전': departure === 'gangnam' ? 140 : 130,
            '세종': departure === 'gangnam' ? 120 : 110,
            '전북': departure === 'gangnam' ? 210 : 200,
            '전남': departure === 'gangnam' ? 300 : 310,
            '광주광역': departure === 'gangnam' ? 268 : 280,
            '경북': departure === 'gangnam' ? 220 : 200,
            '경남': departure === 'gangnam' ? 290 : 280,
            '대구': departure === 'gangnam' ? 237 : 220,
            '부산': departure === 'gangnam' ? 325 : 320,
            '울산': departure === 'gangnam' ? 300 : 290,
            '제주': departure === 'gangnam' ? 460 : 460
        };
        
        for (const [region, defaultDistance] of Object.entries(regionPatterns)) {
            if (dest.includes(region)) {
                console.log(`광역 지역 매칭: ${region}, 기본 거리: ${defaultDistance}km`);
                return defaultDistance;
            }
        }
        
        // 기본값
        console.log('거리 계산 - 매칭 실패, 기본값 사용');
        return departure === 'gangnam' ? 25 : 30;
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
        resultSection: document.getElementById('resultSection'),
        vehiclePreview: document.getElementById('vehiclePreview'),
        vehiclePreviewText: document.getElementById('vehiclePreviewText')
    };

    // 마크업 슬라이더와 입력 필드 동기화
    elements.markupSlider.addEventListener('input', function() {
        elements.markupInput.value = this.value;
    });

    elements.markupInput.addEventListener('input', function() {
        elements.markupSlider.value = this.value;
    });

    // 실시간 차량 유형 미리보기 함수
    function updateVehiclePreview() {
        const widthMm = parseFloat(elements.width.value) || 0;
        const lengthMm = parseFloat(elements.length.value) || 0;
        const heightMm = parseFloat(elements.height.value) || 0;
        const weight = parseFloat(elements.weight.value) || 0;
        
        // mm를 cm로 변환
        const width = widthMm / 10;
        const length = lengthMm / 10;
        const height = heightMm / 10;
        const totalSize = width + length + height;
        
        if (width <= 0 && length <= 0 && height <= 0 && weight <= 0) {
            elements.vehiclePreview.style.display = 'none';
            return;
        }
        
        let selectedVehicle = '';
        let vehicleInfo = '';
        
        // 짐을 돌려서 넣을 수 있으므로 모든 방향 고려
        const dimensions = [width, length, height].sort((a, b) => b - a);
        
        if (weight <= 20 && totalSize <= 140) {
            selectedVehicle = '퀵/바이크';
            vehicleInfo = '가벼운 소형 물품에 적합 (20kg 이하, 합계 140cm 이하)';
        } else if (weight <= 450) {
            const damasLimits = [110, 160, 110].sort((a, b) => b - a);
            if (dimensions[0] <= damasLimits[0] && dimensions[1] <= damasLimits[1] && dimensions[2] <= damasLimits[2]) {
                selectedVehicle = '다마스';
                vehicleInfo = '중형 물품 배송 (450kg 이하, 110×160×110cm)';
            }
        }
        
        if (!selectedVehicle && weight <= 500) {
            const laboLimits = [140, 220, 130].sort((a, b) => b - a);
            if (dimensions[0] <= laboLimits[0] && dimensions[1] <= laboLimits[1] && dimensions[2] <= laboLimits[2]) {
                selectedVehicle = '라보';
                vehicleInfo = '대형 물품 배송 (500kg 이하, 140×220×130cm)';
            }
        }
        
        if (!selectedVehicle && weight <= 1000) {
            const truckLimits = [160, 280, 180].sort((a, b) => b - a);
            if (dimensions[0] <= truckLimits[0] && dimensions[1] <= truckLimits[1] && dimensions[2] <= truckLimits[2]) {
                selectedVehicle = '1톤';
                vehicleInfo = '중량 화물 배송 (1,000kg 이하, 160×280×180cm)';
            }
        }
        
        if (!selectedVehicle) {
            selectedVehicle = '서비스 불가';
            vehicleInfo = '크기 또는 중량이 카카오T 퀵 서비스 한계를 초과했습니다.';
        }
        
        elements.vehiclePreviewText.innerHTML = `<strong style="color: #3498db;">${selectedVehicle}</strong> - ${vehicleInfo}`;
        elements.vehiclePreview.style.display = 'block';
    }

    // 입력값 변경 시 실시간 미리보기 업데이트
    elements.width.addEventListener('input', updateVehiclePreview);
    elements.length.addEventListener('input', updateVehiclePreview);
    elements.height.addEventListener('input', updateVehiclePreview);
    elements.weight.addEventListener('input', updateVehiclePreview);

    // 주소 변경 시 결과 초기화
    function clearResults() {
        // 결과 섹션 숨기기
        elements.resultSection.style.display = 'none';
        
        // 모든 결과값 초기화
        const resultIds = [
            'postOfficeBase', 'postOfficeMarkup', 'postOfficeTotal',
            'gyeongdongBase', 'gyeongdongMarkup', 'gyeongdongTotal',
            'kakaoGangnamBase', 'kakaoGangnamMarkup', 'kakaoGangnamTotal', 
            'kakaoGangnamDistance', 'kakaoGangnamVehicleType', 'kakaoGangnamPriceDetail',
            'kakaoGwangjuBase', 'kakaoGwangjuMarkup', 'kakaoGwangjuTotal',
            'kakaoGwangjuDistance', 'kakaoGwangjuVehicleType', 'kakaoGwangjuPriceDetail'
        ];
        
        resultIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '-';
            }
        });
    }

    // 주소 입력값 변경 시 결과 초기화
    elements.address.addEventListener('input', clearResults);
    elements.detailAddress.addEventListener('input', clearResults);

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
                
                // 주소가 변경되었으므로 기존 계산 결과 초기화
                clearResults();
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
        console.log('주소 분석:', {
            includes서울: fullAddress.includes('서울'),
            includes경기: fullAddress.includes('경기'),
            includes강남: fullAddress.includes('강남'),
            전체주소: fullAddress
        });
        const kakaoGangnamResult = shippingCalculator.calculateKakaoQuick(width, length, height, weight, gangnamDistance);
        if (!kakaoGangnamResult.error) {
            const result = calculateWithMarkup(kakaoGangnamResult.fee);
            document.getElementById('kakaoGangnamBase').textContent = formatCurrency(result.base);
            document.getElementById('kakaoGangnamMarkup').textContent = formatCurrency(result.markup);
            document.getElementById('kakaoGangnamTotal').textContent = formatCurrency(result.total);
            document.getElementById('kakaoGangnamMarkupPercent').textContent = markupPercent;
            document.getElementById('kakaoGangnamDistance').textContent = `약 ${kakaoGangnamResult.distance}km`;
            document.getElementById('kakaoGangnamVehicleType').textContent = kakaoGangnamResult.vehicleType;
            document.getElementById('kakaoGangnamPriceDetail').textContent = kakaoGangnamResult.priceDetail || '';
            document.getElementById('kakaoGangnamCard').classList.remove('disabled');
        } else {
            document.getElementById('kakaoGangnamBase').textContent = kakaoGangnamResult.error;
            document.getElementById('kakaoGangnamMarkup').textContent = '-';
            document.getElementById('kakaoGangnamTotal').textContent = '-';
            document.getElementById('kakaoGangnamDistance').textContent = '-';
            document.getElementById('kakaoGangnamVehicleType').textContent = kakaoGangnamResult.vehicleType || '서비스 불가';
            document.getElementById('kakaoGangnamPriceDetail').textContent = '-';
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
            document.getElementById('kakaoGwangjuVehicleType').textContent = kakaoGwangjuResult.vehicleType;
            document.getElementById('kakaoGwangjuPriceDetail').textContent = kakaoGwangjuResult.priceDetail || '';
            document.getElementById('kakaoGwangjuCard').classList.remove('disabled');
        } else {
            document.getElementById('kakaoGwangjuBase').textContent = kakaoGwangjuResult.error;
            document.getElementById('kakaoGwangjuMarkup').textContent = '-';
            document.getElementById('kakaoGwangjuTotal').textContent = '-';
            document.getElementById('kakaoGwangjuDistance').textContent = '-';
            document.getElementById('kakaoGwangjuVehicleType').textContent = kakaoGwangjuResult.vehicleType || '서비스 불가';
            document.getElementById('kakaoGwangjuPriceDetail').textContent = '-';
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

    // 주소 입력란에서 엔터키로 주소 검색 실행
    elements.address.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // 기본 엔터 동작 방지
            if (elements.addressSearchBtn) {
                elements.addressSearchBtn.click(); // 주소 검색 버튼 클릭
            }
        }
    });

    // 다른 입력란에서 엔터키로 계산 실행
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target !== elements.address) {
            calculateShipping();
        }
    });
});