# 배송비 계산기 배포 가이드

## 빠른 배포 방법 (GitHub Pages)

### 1단계: GitHub 계정 생성
- [github.com](https://github.com) 접속하여 무료 가입

### 2단계: 새 리포지토리 생성
1. 우측 상단 '+' 버튼 → 'New repository' 클릭
2. Repository name: `shipping-calculator`
3. Public 선택
4. 'Create repository' 클릭

### 3단계: 파일 업로드
1. 'uploading an existing file' 링크 클릭
2. 아래 파일들을 드래그 앤 드롭:
   - index.html
   - script.js
   - styles.css
   - README.md
3. 'Commit changes' 클릭

### 4단계: GitHub Pages 활성화
1. Settings 탭 클릭
2. 왼쪽 메뉴에서 'Pages' 클릭
3. Source → Deploy from a branch
4. Branch: main, folder: / (root)
5. Save 클릭

### 5단계: 접속 확인 (5-10분 소요)
```
https://[GitHub사용자명].github.io/shipping-calculator/
```

## 다른 배포 옵션

### Netlify (더 쉬운 방법)
1. [netlify.com](https://www.netlify.com) 접속
2. GitHub 계정으로 로그인
3. 'Add new site' → 'Deploy manually'
4. 프로젝트 폴더를 드래그 앤 드롭
5. 즉시 배포 완료!

### Vercel
1. [vercel.com](https://vercel.com) 접속
2. GitHub 계정으로 로그인
3. 'Import Project' → GitHub 리포지토리 선택
4. 자동 배포 완료

## 문제 해결

### 주소 검색이 안 될 때
- 배포된 사이트는 https로 실행되므로 주소 검색이 정상 작동합니다
- 로컬에서는 주소를 직접 입력하세요

### 페이지가 안 보일 때
- GitHub Pages는 활성화 후 5-10분 정도 걸립니다
- Settings → Pages에서 배포 상태를 확인하세요