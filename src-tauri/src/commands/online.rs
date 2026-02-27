use crate::models::MusicFile;
use regex::Regex;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri_helper::auto_collect_command;
use std::sync::OnceLock;
use std::path::PathBuf;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct BilibiliVideoInfo {
    pub title: String,
    pub author: String,
    pub audio_url: String,
    pub duration: u64,
}

static HTTP_CLIENT: OnceLock<Client> = OnceLock::new();

fn get_client() -> &'static Client {
    HTTP_CLIENT.get_or_init(|| Client::new())
}

#[tauri::command]
#[auto_collect_command]
pub async fn parse_bilibili_url(url: String) -> Result<MusicFile, String> {
    println!("解析B站链接: {}", url);

    let bv_regex = Regex::new(r"BV[\w]+").map_err(|e| e.to_string())?;
    let bv_id = bv_regex
        .find(&url)
        .ok_or("无法从链接中提取BV号")?
        .as_str();

    let api_url = format!(
        "https://api.bilibili.com/x/web-interface/view?bvid={}",
        bv_id.trim_start_matches("BV")
    );

    let client = get_client();
    let response = client
        .get(&api_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("请求B站API失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("B站API返回错误: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析B站响应失败: {}", e))?;

    let data = json.get("data").ok_or("B站API返回数据为空")?;
    let title = data["title"].as_str().unwrap_or("未知标题").to_string();
    let author = data["owner"]["name"].as_str().unwrap_or("未知作者").to_string();

    let cid = data["cid"].as_u64().ok_or("无法获取视频CID")?;
    let aid = data["aid"].as_u64().ok_or("无法获取视频AID")?;

    let play_url = format!(
        "https://api.bilibili.com/x/player/playurl?avid={}&cid={}&qn=80&fnval=16",
        aid, cid
    );

    let play_response = client
        .get(&play_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .header("Referer", "https://www.bilibili.com/")
        .send()
        .await
        .map_err(|e| format!("获取播放地址失败: {}", e))?;

    let play_json: serde_json::Value = play_response
        .json()
        .await
        .map_err(|e| format!("解析播放地址失败: {}", e))?;

    let audio_info = play_json["data"]["dash"]["audio"]
        .as_array()
        .and_then(|arr| arr.first());

    let audio_url = audio_info
        .and_then(|a| a["baseUrl"].as_str())
        .ok_or("无法获取音频播放地址")?;

    let codec = audio_info
        .and_then(|a| a["codecs"].as_str())
        .unwrap_or("unknown");

    println!("音频格式: {}, URL: {}", codec, audio_url);
    println!("成功解析: {} - {}", author, title);

    Ok(MusicFile {
        path: audio_url.to_string(),
        name: format!("{} - {}", author, title),
        is_online: Some(true),
    })
}

#[tauri::command]
#[auto_collect_command]
pub async fn get_bilibili_audio_stream(audio_url: String) -> Result<Vec<u8>, String> {
    let client = get_client();
    
    let response = client
        .get(&audio_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .header("Referer", "https://www.bilibili.com/")
        .send()
        .await
        .map_err(|e| format!("请求音频失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("音频请求失败: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取音频数据失败: {}", e))?;

    Ok(bytes.to_vec())
}

#[tauri::command]
#[auto_collect_command]
pub async fn download_bilibili_audio(
    audio_url: String, 
    song_name: String, 
    download_folder: String
) -> Result<String, String> {
    let client = get_client();
    
    let response = client
        .get(&audio_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .header("Referer", "https://www.bilibili.com/")
        .send()
        .await
        .map_err(|e| format!("请求音频失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("音频请求失败: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取音频数据失败: {}", e))?;

    let folder = PathBuf::from(&download_folder);
    if !folder.exists() {
        fs::create_dir_all(&folder).map_err(|e| format!("创建下载文件夹失败: {}", e))?;
    }

    let safe_name: String = song_name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ' || *c == '-' || *c == '_')
        .collect();
    
    let file_name = if safe_name.trim().is_empty() {
        format!("download_{}.m4a", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs())
    } else {
        format!("{}.m4a", safe_name.trim())
    };

    let file_path = folder.join(&file_name);
    fs::write(&file_path, &bytes).map_err(|e| format!("保存文件失败: {}", e))?;

    println!("下载成功: {:?}", file_path);
    Ok(file_path.to_string_lossy().to_string())
}