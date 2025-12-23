use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Problem {
    pub id: String,
    pub title: String,
    pub description: String,
    pub input_description: String,
    pub output_description: String,
    pub samples: Vec<Sample>,
    pub time_limit: String,
    pub memory_limit: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Sample {
    pub input: String,
    pub output: String,
}

pub async fn fetch_problem(problem_id: &str) -> Result<Problem, String> {
    let url = format!("https://www.acmicpc.net/problem/{}", problem_id);
    
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch problem: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Problem not found: {}", problem_id));
    }
    
    let html = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    parse_problem(problem_id, &html)
}

fn parse_problem(problem_id: &str, html: &str) -> Result<Problem, String> {
    let document = Html::parse_document(html);
    
    let title_sel = Selector::parse("#problem_title").unwrap();
    let description_sel = Selector::parse("#problem_description").unwrap();
    let input_sel = Selector::parse("#problem_input").unwrap();
    let output_sel = Selector::parse("#problem_output").unwrap();
    let time_limit_sel = Selector::parse("#problem-info tbody tr td").unwrap();
    let sample_input_sel = Selector::parse("[id^='sample-input-']").unwrap();
    let sample_output_sel = Selector::parse("[id^='sample-output-']").unwrap();
    
    let title = document
        .select(&title_sel)
        .next()
        .map(|e| e.text().collect::<String>())
        .unwrap_or_default()
        .trim()
        .to_string();
    
    let description = document
        .select(&description_sel)
        .next()
        .map(|e| element_to_text(&e))
        .unwrap_or_default();
    
    let input_description = document
        .select(&input_sel)
        .next()
        .map(|e| element_to_text(&e))
        .unwrap_or_default();
    
    let output_description = document
        .select(&output_sel)
        .next()
        .map(|e| element_to_text(&e))
        .unwrap_or_default();
    
    let limits: Vec<String> = document
        .select(&time_limit_sel)
        .take(2)
        .map(|e| e.text().collect::<String>().trim().to_string())
        .collect();
    
    let time_limit = limits.get(0).cloned().unwrap_or_default();
    let memory_limit = limits.get(1).cloned().unwrap_or_default();
    
    let sample_inputs: Vec<String> = document
        .select(&sample_input_sel)
        .map(|e| e.text().collect::<String>().trim().to_string())
        .collect();
    
    let sample_outputs: Vec<String> = document
        .select(&sample_output_sel)
        .map(|e| e.text().collect::<String>().trim().to_string())
        .collect();
    
    let samples: Vec<Sample> = sample_inputs
        .into_iter()
        .zip(sample_outputs.into_iter())
        .map(|(input, output)| Sample { input, output })
        .collect();
    
    if title.is_empty() {
        return Err("Failed to parse problem title".to_string());
    }
    
    Ok(Problem {
        id: problem_id.to_string(),
        title,
        description,
        input_description,
        output_description,
        samples,
        time_limit,
        memory_limit,
    })
}

fn element_to_text(element: &scraper::ElementRef) -> String {
    let html = element.inner_html();
    let text = html
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
        .replace("</p>", "\n")
        .replace("</div>", "\n");
    
    let fragment = Html::parse_fragment(&text);
    fragment
        .root_element()
        .text()
        .collect::<String>()
        .lines()
        .map(|l| l.trim())
        .collect::<Vec<_>>()
        .join("\n")
        .trim()
        .to_string()
}
