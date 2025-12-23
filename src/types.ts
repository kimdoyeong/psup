export interface Problem {
  id: string;
  title: string;
  description: string;
  input_description: string;
  output_description: string;
  samples: Sample[];
  time_limit: string;
  memory_limit: string;
}

export interface Sample {
  input: string;
  output: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProblemRecord {
  id: number;
  problem_id: string;
  title: string;
  description: string;
  input_description: string;
  output_description: string;
  samples_json: string;
  time_limit: string;
  memory_limit: string;
  created_at: string;
}

export interface ActivityData {
  date: string;
  count: number;
  level: number;
}
