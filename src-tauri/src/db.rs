use crate::models::MusicFile;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager; // 用于获取 path_resolver 等
use tauri_helper::auto_collect_command;

// 定义整个数据库的结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppData {
    pub songs: Vec<MusicFile>,
}

// 定义 JSON 文件名
const DB_FILENAME: &str = "music_library.json";

// 获取数据库文件路径的辅助函数
fn get_db_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    // 获取 App 的本地数据目录
    // Windows: C:\Users\Name\AppData\Local\com.your.app\
    // Mac: /Users/Name/Library/Application Support/com.your.app/
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取数据目录: {}", e))?;

    // 如果目录不存在，创建它
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("无法创建数据目录: {}", e))?;
    }

    Ok(app_dir.join(DB_FILENAME))
}

// 2. [Command] 保存歌单
#[tauri::command]
#[auto_collect_command]
pub fn save_playlist(app_handle: AppHandle, songs: Vec<MusicFile>) -> Result<(), String> {
    let path = get_db_path(&app_handle)?;

    // 包装一下数据
    let data = AppData { songs };

    // 序列化为 JSON 字符串
    let json_string =
        serde_json::to_string_pretty(&data).map_err(|e| format!("序列化失败: {}", e))?;

    // 写入文件
    fs::write(&path, json_string).map_err(|e| format!("写入文件失败: {}", e))?;

    println!("歌单已保存到: {:?}", path);
    Ok(())
}

// 3. [Command] 读取歌单
#[tauri::command]
#[auto_collect_command]
pub fn load_playlist(app_handle: AppHandle) -> Result<Vec<MusicFile>, String> {
    let path = get_db_path(&app_handle)?;

    if !path.exists() {
        // 如果文件不存在，返回空列表
        return Ok(Vec::new());
    }

    // 读取文件内容
    let json_string = fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))?;

    // 反序列化
    let data: AppData =
        serde_json::from_str(&json_string).map_err(|e| format!("解析 JSON 失败: {}", e))?;

    println!("成功加载 {} 首歌", data.songs.len());
    Ok(data.songs)
}
