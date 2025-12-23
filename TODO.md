# TODO: 채팅 기록 1:1 대응 작업

## 작업 목록

- [x] Backend: Remove mode from chats table, add upsert logic for 1:1 problem-chat
- [x] Backend: Update Tauri commands for single chat per problem
- [x] Frontend: Remove mode tabs, merge system prompts into unified tutor
- [x] Frontend: Update useChat to load/save single chat per problem
- [x] Verify build passes

## 변경 사항

### Backend (Rust)
- `ChatRecord` struct에서 `mode` 필드 제거
- `chats` 테이블: `mode` 컬럼 제거, `problem_id`에 UNIQUE 제약 추가
- `save_chat`: mode 파라미터 제거, UPSERT (INSERT OR REPLACE) 로직 적용
- `get_chat_by_problem`: 단일 `Option<ChatRecord>` 반환

### Frontend (React)
- `ChatMode` 타입 제거
- `ChatPanel`: 모드 탭 UI 제거
- `useChat`: 
  - 문제 변경 시 자동으로 해당 문제의 채팅 로드
  - 메시지 전송 후 자동 저장
  - 대화 초기화 시 DB도 초기화
- `App.tsx`: 코드 에디터 항상 표시

## 완료됨
