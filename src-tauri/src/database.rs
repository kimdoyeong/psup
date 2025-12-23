use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProblemRecord {
    pub id: i64,
    pub problem_id: String,
    pub title: String,
    pub description: String,
    pub input_description: String,
    pub output_description: String,
    pub samples_json: String,
    pub time_limit: String,
    pub memory_limit: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatRecord {
    pub id: i64,
    pub problem_id: String,
    pub messages_json: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SolveRecord {
    pub id: i64,
    pub problem_id: String,
    pub solved_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityData {
    pub date: String,
    pub count: i32,
    pub level: i32,
}

impl Database {
    pub fn new(db_path: PathBuf) -> SqliteResult<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        
        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS problems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem_id TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                input_description TEXT NOT NULL,
                output_description TEXT NOT NULL,
                samples_json TEXT NOT NULL,
                time_limit TEXT NOT NULL,
                memory_limit TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem_id TEXT NOT NULL UNIQUE,
                messages_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS solve_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                problem_id TEXT NOT NULL,
                solved_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_problems_problem_id ON problems(problem_id);
            CREATE INDEX IF NOT EXISTS idx_chats_problem_id ON chats(problem_id);
            CREATE INDEX IF NOT EXISTS idx_solve_records_solved_at ON solve_records(solved_at);
            "
        )?;
        
        Ok(())
    }

    pub fn save_problem(&self, problem: &crate::crawler::Problem) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        let samples_json = serde_json::to_string(&problem.samples).unwrap_or_default();
        
        conn.execute(
            "INSERT OR REPLACE INTO problems 
             (problem_id, title, description, input_description, output_description, samples_json, time_limit, memory_limit)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            [
                &problem.id,
                &problem.title,
                &problem.description,
                &problem.input_description,
                &problem.output_description,
                &samples_json,
                &problem.time_limit,
                &problem.memory_limit,
            ],
        )?;
        
        Ok(conn.last_insert_rowid())
    }

    pub fn get_problem(&self, problem_id: &str) -> SqliteResult<Option<ProblemRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, problem_id, title, description, input_description, output_description, 
                    samples_json, time_limit, memory_limit, created_at
             FROM problems WHERE problem_id = ?1"
        )?;
        
        let mut rows = stmt.query([problem_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(ProblemRecord {
                id: row.get(0)?,
                problem_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                input_description: row.get(4)?,
                output_description: row.get(5)?,
                samples_json: row.get(6)?,
                time_limit: row.get(7)?,
                memory_limit: row.get(8)?,
                created_at: row.get(9)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn get_all_problems(&self) -> SqliteResult<Vec<ProblemRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, problem_id, title, description, input_description, output_description,
                    samples_json, time_limit, memory_limit, created_at
             FROM problems ORDER BY created_at DESC"
        )?;
        
        let rows = stmt.query_map([], |row| {
            Ok(ProblemRecord {
                id: row.get(0)?,
                problem_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                input_description: row.get(4)?,
                output_description: row.get(5)?,
                samples_json: row.get(6)?,
                time_limit: row.get(7)?,
                memory_limit: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;
        
        rows.collect()
    }

    pub fn save_chat(&self, problem_id: &str, messages_json: &str) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        
        let existing: Option<i64> = conn
            .query_row(
                "SELECT id FROM chats WHERE problem_id = ?1",
                [problem_id],
                |row| row.get(0),
            )
            .ok();
        
        if let Some(chat_id) = existing {
            conn.execute(
                "UPDATE chats SET messages_json = ?1, updated_at = datetime('now') WHERE id = ?2",
                rusqlite::params![messages_json, chat_id],
            )?;
            Ok(chat_id)
        } else {
            conn.execute(
                "INSERT INTO chats (problem_id, messages_json) VALUES (?1, ?2)",
                [problem_id, messages_json],
            )?;
            Ok(conn.last_insert_rowid())
        }
    }

    pub fn get_chat_by_problem(&self, problem_id: &str) -> SqliteResult<Option<ChatRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, problem_id, messages_json, created_at, updated_at
             FROM chats WHERE problem_id = ?1"
        )?;
        
        let mut rows = stmt.query([problem_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(ChatRecord {
                id: row.get(0)?,
                problem_id: row.get(1)?,
                messages_json: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn delete_problem(&self, problem_id: &str) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM problems WHERE problem_id = ?1", [problem_id])?;
        conn.execute("DELETE FROM chats WHERE problem_id = ?1", [problem_id])?;
        Ok(())
    }

    pub fn record_solve(&self, problem_id: &str) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        
        let today_exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM solve_records WHERE problem_id = ?1 AND date(solved_at) = date('now'))",
                [problem_id],
                |row| row.get(0),
            )
            .unwrap_or(false);
        
        if today_exists {
            return Ok(0);
        }
        
        conn.execute(
            "INSERT INTO solve_records (problem_id) VALUES (?1)",
            [problem_id],
        )?;
        
        Ok(conn.last_insert_rowid())
    }

    pub fn unrecord_solve(&self, problem_id: &str) -> SqliteResult<bool> {
        let conn = self.conn.lock().unwrap();
        
        let deleted = conn.execute(
            "DELETE FROM solve_records WHERE problem_id = ?1 AND date(solved_at) = date('now')",
            [problem_id],
        )?;
        
        Ok(deleted > 0)
    }

    pub fn is_solved_today(&self, problem_id: &str) -> SqliteResult<bool> {
        let conn = self.conn.lock().unwrap();
        
        let exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM solve_records WHERE problem_id = ?1 AND date(solved_at) = date('now'))",
                [problem_id],
                |row| row.get(0),
            )
            .unwrap_or(false);
        
        Ok(exists)
    }

    pub fn get_activity_data(&self, days: i32) -> SqliteResult<Vec<ActivityData>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT date(solved_at) as solve_date, COUNT(*) as count
             FROM solve_records
             WHERE solved_at >= datetime('now', ?1)
             GROUP BY solve_date
             ORDER BY solve_date ASC"
        )?;
        
        let days_param = format!("-{} days", days);
        let rows = stmt.query_map([&days_param], |row| {
            let count: i32 = row.get(1)?;
            let level = match count {
                0 => 0,
                1..=2 => 1,
                3..=5 => 2,
                6..=10 => 3,
                _ => 4,
            };
            Ok(ActivityData {
                date: row.get(0)?,
                count,
                level,
            })
        })?;
        
        rows.collect()
    }
}
