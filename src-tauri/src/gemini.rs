use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use futures::StreamExt;

const GEMINI_API_URL: &str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_STREAM_URL: &str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent";

#[derive(Debug, Serialize)]
struct GeminiRequest {
    contents: Vec<Content>,
    generation_config: GenerationConfig,
}

#[derive(Debug, Serialize)]
struct Content {
    role: String,
    parts: Vec<Part>,
}

#[derive(Debug, Serialize)]
struct Part {
    text: String,
}

#[derive(Debug, Serialize)]
struct GenerationConfig {
    temperature: f32,
    max_output_tokens: u32,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<Candidate>>,
    error: Option<GeminiError>,
}

#[derive(Debug, Deserialize)]
struct Candidate {
    content: CandidateContent,
}

#[derive(Debug, Deserialize)]
struct CandidateContent {
    parts: Vec<ResponsePart>,
}

#[derive(Debug, Deserialize)]
struct ResponsePart {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GeminiError {
    message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct StreamChunk {
    pub text: String,
    pub done: bool,
}

fn build_contents(messages: Vec<ChatMessage>, system_prompt: &str) -> Vec<Content> {
    let mut contents: Vec<Content> = vec![];
    
    if !system_prompt.is_empty() {
        contents.push(Content {
            role: "user".to_string(),
            parts: vec![Part {
                text: format!("[System Instructions]\n{}\n\n[End System Instructions]", system_prompt),
            }],
        });
        contents.push(Content {
            role: "model".to_string(),
            parts: vec![Part {
                text: "I understand. I'll follow these instructions.".to_string(),
            }],
        });
    }
    
    for msg in messages {
        contents.push(Content {
            role: if msg.role == "user" { "user".to_string() } else { "model".to_string() },
            parts: vec![Part { text: msg.content }],
        });
    }
    
    contents
}

pub async fn chat(
    api_key: &str,
    messages: Vec<ChatMessage>,
    system_prompt: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let contents = build_contents(messages, system_prompt);
    
    let request = GeminiRequest {
        contents,
        generation_config: GenerationConfig {
            temperature: 0.7,
            max_output_tokens: 8192,
        },
    };
    
    let url = format!("{}?key={}", GEMINI_API_URL, api_key);
    
    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;
    
    let gemini_response: GeminiResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    if let Some(error) = gemini_response.error {
        return Err(format!("Gemini API error: {}", error.message));
    }
    
    gemini_response
        .candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content.parts.into_iter().next())
        .map(|p| p.text)
        .ok_or_else(|| "No response from Gemini".to_string())
}

pub async fn chat_stream(
    app: AppHandle,
    api_key: &str,
    messages: Vec<ChatMessage>,
    system_prompt: &str,
    session_id: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let contents = build_contents(messages, system_prompt);
    
    let request = GeminiRequest {
        contents,
        generation_config: GenerationConfig {
            temperature: 0.7,
            max_output_tokens: 8192,
        },
    };
    
    let url = format!("{}?key={}&alt=sse", GEMINI_STREAM_URL, api_key);
    
    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;
    
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API error: {}", error_text));
    }
    
    let mut full_response = String::new();
    let mut stream = response.bytes_stream();
    let event_name = format!("chat-stream-{}", session_id);
    
    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes);
                
                for line in text.lines() {
                    if let Some(data) = line.strip_prefix("data: ") {
                        if let Ok(response) = serde_json::from_str::<GeminiResponse>(data) {
                            if let Some(candidates) = response.candidates {
                                for candidate in candidates {
                                    for part in candidate.content.parts {
                                        full_response.push_str(&part.text);
                                        let _ = app.emit(&event_name, StreamChunk {
                                            text: part.text,
                                            done: false,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                return Err(format!("Stream error: {}", e));
            }
        }
    }
    
    let _ = app.emit(&event_name, StreamChunk {
        text: String::new(),
        done: true,
    });
    
    Ok(full_response)
}
