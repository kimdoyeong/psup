// 백준에서 크롤링해온 문제 정보
export interface Problem {
  id: string; // 문제 번호 (예: "1000")
  title: string; // 문제 제목
  description: string; // 문제 설명
  input_description: string; // 입력 설명
  output_description: string; // 출력 설명
  samples: Sample[]; // 예제 입력/출력들
  time_limit: string; // 시간 제한
  memory_limit: string; // 메모리 제한
}

// 입출력 예제 한 개
export interface Sample {
  input: string; // 입력 예제
  output: string; // 출력 예제
}

// AI와의 대화 메시지 하나
export interface ChatMessage {
  role: "user" | "assistant"; // "user"는 사용자 메시지, "assistant"는 AI 메시지
  content: string; // 메시지 내용
}

// 데이터베이스에 저장된 문제 정보
export interface ProblemRecord {
  id: number; // 데이터베이스 ID
  problem_id: string; // 백준 문제 번호
  title: string; // 문제 제목
  description: string; // 문제 설명
  input_description: string; // 입력 설명
  output_description: string; // 출력 설명
  samples_json: string; // 예제들을 JSON으로 저장한 것
  time_limit: string; // 시간 제한
  memory_limit: string; // 메모리 제한
  created_at: string; // 언제 저장했는지
}

// 활동 그래프에 표시할 데이터 (GitHub 스타일)
export interface ActivityData {
  date: string; // 날짜
  count: number; // 그 날에 푼 문제 수
  level: number; // 강도 (0~4)
}
