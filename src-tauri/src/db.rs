use crate::models::MusicFile;
use std::fs;
use tauri::AppHandle;
use tauri::Manager;
use tauri_helper::auto_collect_command;

// 定义文件名
const LIBRARY_FILE: &str = "library.json"; // 存所有歌
const PLAYLIST_FILE: &str = "playlist.json"; // 存当前歌单

// --- 私有辅助函数 ---
fn save_json_file(
    app_handle: &AppHandle,
    filename: &str,
    songs: &Vec<MusicFile>,
) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    if !app_dir.exists() {
        let _ = fs::create_dir_all(&app_dir);
    }
    let path = app_dir.join(filename);
    let json = serde_json::to_string_pretty(songs).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

fn load_json_file(app_handle: &AppHandle, filename: &str) -> Result<Vec<MusicFile>, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let path = app_dir.join(filename);
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    // 处理空文件情况
    if content.trim().is_empty() {
        return Ok(Vec::new());
    }
    let songs: Vec<MusicFile> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(songs)
}

// --- 公开 Commands ---

// 1. [扫描后调用] 保存所有音乐到库
#[tauri::command]
#[auto_collect_command]
pub fn save_to_library(app_handle: AppHandle, songs: Vec<MusicFile>) -> Result<(), String> {
    save_json_file(&app_handle, LIBRARY_FILE, &songs)
}

// 2. [启动时/AI调用] 读取所有音乐
#[tauri::command]
#[auto_collect_command]
pub fn load_library(app_handle: AppHandle) -> Result<Vec<MusicFile>, String> {
    load_json_file(&app_handle, LIBRARY_FILE)
}

// 3. [AI生成后/用户修改后调用] 保存当前播放列表
#[tauri::command]
#[auto_collect_command]
pub fn save_playlist(app_handle: AppHandle, songs: Vec<MusicFile>) -> Result<(), String> {
    save_json_file(&app_handle, PLAYLIST_FILE, &songs)
}

// 4. [启动时调用] 恢复上次的播放列表
#[tauri::command]
#[auto_collect_command]
pub fn load_playlist(app_handle: AppHandle) -> Result<Vec<MusicFile>, String> {
    load_json_file(&app_handle, PLAYLIST_FILE)
}
