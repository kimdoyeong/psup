# PSUP - AI PS 도우미

백준 문제를 가져와 AI(Google Gemini)와 함께 문제 해결을 도와주는 데스크톱 앱

## 기술 스택

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Tauri 2 (Rust)
- **AI**: Google Gemini API

## 기능

- [ ] 백준 문제 조회 (번호 입력 → 크롤링)
- [ ] AI 힌트 (문제 접근법, 알고리즘 제안)
- [ ] 코드 리뷰 (사용자 코드 분석 및 피드백)
- [ ] 테스트케이스 생성 (엣지 케이스 포함)
- [ ] API 키 관리 (앱 내 설정)

## 개발 환경 설정

```bash
npm install
npm run tauri dev
```

## 빌드

```bash
npm run tauri build
```
