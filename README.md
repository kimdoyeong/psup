# PSUP - AI PS 도우미

백준 문제를 가져와 AI(Google Gemini)와 함께 문제 해결을 도와주는 데스크톱 앱
이 앱은 99.9% **AI 해줘** 코딩으로 제작되었습니다. (thanks to opencode)

## 기술 스택

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite 7
- **Backend**: Tauri 2 (Rust 2021) + SQLite
- **AI**: Google Gemini API (스트리밍 지원)

## 기능

- [x] 백준 문제 조회 (번호 입력 → 크롤링)
- [x] AI 튜터 (힌트, 코드 리뷰, 테스트케이스 생성 통합)
- [x] 코드 에디터 (리뷰용 코드 입력)
- [x] 문제별 채팅 기록 저장/불러오기
- [x] 문제 히스토리 관리 (조회/삭제)
- [x] 풀이 활동 그래프 (GitHub 스타일)
- [x] 동적 API 키 관리 (로컬 저장)
- [x] Gemini 모델 선택 (실시간 API 조회)
- [x] 커스텀 시스템 프롬프트

## 스크린샷

```
┌─────────────────────────────────────────────────────────────┐
│ PSUP                                              [설정]    │
├──────────┬──────────────────────┬───────────────────────────┤
│ 기록     │ [문제 번호 입력]     │                           │
│          ├──────────────────────┤      AI 튜터              │
│ #1000    │                      │                           │
│ A+B      │   문제 설명          │   채팅 영역               │
│          │                      │                           │
│ #1003    │   입력/출력          │                           │
│ 피보나치 │                      ├───────────────────────────┤
│          │   예제               │   코드 에디터             │
│ ░░█░░░   │                      │                           │
└──────────┴──────────────────────┴───────────────────────────┘
```

## 개발 환경 설정

```bash
npm install
npm run tauri dev
```

## 빌드

```bash
npm run tauri build
```

## macOS에서 앱 실행

GitHub Release에서 다운로드한 `.dmg` 파일에서 앱을 실행할 때 "손상되었기 때문에 열 수 없습니다" 오류가 뜨면:

```bash
# 터미널에서 다음 명령어 실행
xattr -d com.apple.quarantine /Applications/psup.app
```

또는:
1. psup.app 우클릭 → "열기" 선택
2. 보안 경고에서 "열기" 버튼 클릭

### GitHub Actions를 통한 자동 빌드

태그를 푸시하면 자동으로 Windows와 macOS(Intel/Apple Silicon)용 바이너리가 빌드되고 GitHub Release에 업로드됩니다.

```bash
# 버전 업데이트
npm version minor

# 태그 푸시 (자동 빌드 트리거)
git push origin main
git push origin --tags
```

자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

## Settings (설정)

### API 키 입력
- Google Gemini API 키 설정
- 로컬 저장소에 암호화되지 않음 (개인 환경에서만 사용)

### 모델 선택 (동적 로드)
- API 키 입력 시 자동으로 사용 가능한 Gemini 모델 목록 조회
- 실패 시 기본 모델 목록으로 폴백
- 현재 지원 모델:
  - **Gemini 3.x**: Pro, Flash
  - **Gemini 2.5.x**: Pro, Flash, Flash Lite
  - **Gemini 2.0.x**: Flash, Flash Lite

### 커스텀 시스템 프롬프트
- 기본 프롬프트로 복원 가능
- 각 대화에서 설정된 프롬프트 적용

## 프로젝트 구조

```
psup/
├── src/                       # React 프론트엔드
│   ├── components/
│   │   ├── Settings.tsx       # 설정 모달 (API 키, 모델, 프롬프트)
│   │   ├── ChatPanel.tsx      # AI 채팅 영역
│   │   ├── CodeEditor.tsx     # 코드 에디터
│   │   ├── ProblemView.tsx    # 문제 설명 영역
│   │   ├── ProblemInput.tsx   # 문제 번호 입력
│   │   └── HistorySidebar.tsx # 문제 기록 & 활동 그래프
│   ├── hooks/
│   │   ├── useSettings.ts     # 설정 관리 + 동적 모델 로드
│   │   ├── useChat.ts         # 채팅 로직
│   │   ├── useProblem.ts      # 문제 조회
│   │   └── useHistory.ts      # 히스토리 관리
│   ├── App.tsx                # 메인 컴포넌트
│   └── types.ts               # 타입 정의
├── src-tauri/                 # Rust 백엔드
│   └── src/
│       ├── crawler.rs         # 백준 웹 크롤러
│       ├── database.rs        # SQLite 데이터베이스
│       ├── gemini.rs          # Gemini API 통합
│       │                       ├─ chat()                  # 일반 채팅
│       │                       ├─ chat_stream()           # 스트리밍 채팅
│       │                       └─ fetch_available_models() # 동적 모델 조회
│       └── lib.rs             # Tauri 커맨드 핸들러
└── package.json
```
