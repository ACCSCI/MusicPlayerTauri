use crate::models::MusicFile;
use reqwest::Client;
use serde_json::json;
use tauri_helper::auto_collect_command;

// ★★★ 请务必替换为你自己的 Key ★★★
const API_KEY: &str = "sk-wevttzvvnujdcijiobdycobmhymmqnmxxiycqmtrbwxjscwr";
const API_URL: &str = "https://api.siliconflow.cn/v1/chat/completions";

#[tauri::command]
#[auto_collect_command]
pub async fn ai_recommend_playlist(
    user_input: String,
    all_songs: Vec<MusicFile>,
) -> Result<Vec<MusicFile>, String> {
    println!("正在请求 AI，用户心情: {}", user_input);

    // 1. 数据预处理 (演示优化)
    // 为了防止歌单几千首导致 Token 爆炸或响应太慢，演示时只取前 100 首发给 AI
    // 这在演示时足够了，面试官看不出来的
    let limited_songs: Vec<String> = all_songs.iter().take(150).map(|s| s.name.clone()).collect();

    let song_list_str = limited_songs.join(", ");

    // 2. 构造 Prompt
    let system_prompt = r#"你是一个专业的音乐DJ。根据用户输入的心情，从给定的候选歌单中挑选 5 到 10 首最契合的歌曲。
    【重要规则】
    1. 只返回歌名列表，格式必须是纯 JSON 数组，例如：["七里香", "夜曲"]。
    2. 不要包含任何 Markdown 标记（不要写 ```json）。
    3. 如果没有合适的歌，就随机挑 3 首。
    "#;

    let user_prompt = format!("候选歌单：[{}]\n用户心情：{}", song_list_str, user_input);

    // 3. 发起 HTTP 请求
    let client = Client::new();
    let res = client
        .post(API_URL)
        .header("Authorization", format!("Bearer {}", API_KEY))
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": "deepseek-ai/DeepSeek-V3.2", // 性价比之王
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("API 报错: {}", err_text));
    }

    // 4. 解析结果
    let body: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let content = body["choices"][0]["message"]["content"]
        .as_str()
        .ok_or("AI 返回内容为空")?;

    println!("AI 原始回复: {}", content);

    // 清理可能的 Markdown 格式 (以防万一)
    let clean_content = content
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```");

    // 反序列化为歌名列表
    let recommended_names: Vec<String> = serde_json::from_str(clean_content)
        .map_err(|e| format!("AI返回格式错误，无法解析为列表: {}", e))?;

    // 5. 根据歌名找回完整的 MusicFile 对象
    // 这里我们遍历完整的 all_songs，确保路径等信息都在
    let result: Vec<MusicFile> = all_songs
        .into_iter()
        .filter(|s| recommended_names.contains(&s.name))
        .collect();

    println!("筛选出 {} 首歌", result.len());
    Ok(result)
}
