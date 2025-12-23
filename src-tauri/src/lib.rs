mod crawler;
mod database;
mod gemini;

use crawler::Problem;
use database::{ActivityData, ChatRecord, Database, ProblemRecord};
use gemini::ChatMessage;
use tauri::{AppHandle, Manager, State};

#[tauri::command]
async fn fetch_problem(
    db: State<'_, Database>,
    problem_id: String,
) -> Result<Problem, String> {
    let problem = crawler::fetch_problem(&problem_id).await?;
    db.save_problem(&problem).map_err(|e| e.to_string())?;
    Ok(problem)
}

#[tauri::command]
async fn chat_with_ai(
    api_key: String,
    messages: Vec<ChatMessage>,
    system_prompt: String,
) -> Result<String, String> {
    gemini::chat(&api_key, messages, &system_prompt).await
}

#[tauri::command]
async fn chat_with_ai_stream(
    app: AppHandle,
    api_key: String,
    messages: Vec<ChatMessage>,
    system_prompt: String,
    session_id: String,
) -> Result<String, String> {
    gemini::chat_stream(app, &api_key, messages, &system_prompt, session_id).await
}

#[tauri::command]
async fn get_all_problems(db: State<'_, Database>) -> Result<Vec<ProblemRecord>, String> {
    db.get_all_problems().map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_cached_problem(
    db: State<'_, Database>,
    problem_id: String,
) -> Result<Option<ProblemRecord>, String> {
    db.get_problem(&problem_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_chat(
    db: State<'_, Database>,
    problem_id: String,
    messages_json: String,
) -> Result<i64, String> {
    db.save_chat(&problem_id, &messages_json)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_chat_by_problem(
    db: State<'_, Database>,
    problem_id: String,
) -> Result<Option<ChatRecord>, String> {
    db.get_chat_by_problem(&problem_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_problem(db: State<'_, Database>, problem_id: String) -> Result<(), String> {
    db.delete_problem(&problem_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn record_solve(db: State<'_, Database>, problem_id: String) -> Result<i64, String> {
    db.record_solve(&problem_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_activity_data(
    db: State<'_, Database>,
    days: i32,
) -> Result<Vec<ActivityData>, String> {
    db.get_activity_data(days).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            let db_path = app_data_dir.join("psup.db");
            let db = Database::new(db_path).expect("Failed to initialize database");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            fetch_problem,
            chat_with_ai,
            chat_with_ai_stream,
            get_all_problems,
            get_cached_problem,
            save_chat,
            get_chat_by_problem,
            delete_problem,
            record_solve,
            get_activity_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
