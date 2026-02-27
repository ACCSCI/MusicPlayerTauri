use crate::models::{MusicFile, Playlist};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;
use tauri_helper::auto_collect_command;

const LIBRARY_FILE: &str = "library.json";
const PLAYLIST_FILE: &str = "playlist.json";
const PLAYLISTS_FILE: &str = "playlists.json";
const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, Default)]
pub struct AppSettings {
    pub download_folder: Option<String>,
}

fn save_json_file<T: serde::Serialize>(
    app_handle: &AppHandle,
    filename: &str,
    data: &T,
) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    if !app_dir.exists() {
        let _ = fs::create_dir_all(&app_dir);
    }
    let path = app_dir.join(filename);
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

fn load_json_file<T: serde::de::DeserializeOwned>(
    app_handle: &AppHandle,
    filename: &str,
) -> Result<T, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let path = app_dir.join(filename);
    if !path.exists() {
        return Err(format!("文件不存在: {}", filename));
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Err(format!("文件为空: {}", filename));
    }
    let data: T = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(data)
}

fn ensure_system_playlists(playlists: &mut Vec<Playlist>) {
    let has_local = playlists.iter().any(|p| p.id == "local");
    let has_favorites = playlists.iter().any(|p| p.id == "favorites");

    if !has_local {
        playlists.insert(
            0,
            Playlist {
                id: "local".to_string(),
                name: "本地音乐".to_string(),
                songs: vec![],
                is_system: Some(true),
            },
        );
    }

    if !has_favorites {
        playlists.insert(
            1,
            Playlist {
                id: "favorites".to_string(),
                name: "我喜欢的音乐".to_string(),
                songs: vec![],
                is_system: Some(true),
            },
        );
    }
}

#[tauri::command]
#[auto_collect_command]
pub fn save_to_library(app_handle: AppHandle, songs: Vec<MusicFile>) -> Result<(), String> {
    // 增量追加而不是覆盖
    let existing: Vec<MusicFile> = load_json_file(&app_handle, LIBRARY_FILE).unwrap_or_default();

    let mut merged = existing;
    for song in songs {
        if !merged.iter().any(|s| s.path == song.path) {
            merged.push(song);
        }
    }

    save_json_file(&app_handle, LIBRARY_FILE, &merged)
}

#[tauri::command]
#[auto_collect_command]
pub fn load_library(app_handle: AppHandle) -> Result<Vec<MusicFile>, String> {
    load_json_file(&app_handle, LIBRARY_FILE).or_else(|_| Ok(vec![]))
}

#[tauri::command]
#[auto_collect_command]
pub fn save_playlist(app_handle: AppHandle, songs: Vec<MusicFile>) -> Result<(), String> {
    save_json_file(&app_handle, PLAYLIST_FILE, &songs)
}

#[tauri::command]
#[auto_collect_command]
pub fn load_playlist(app_handle: AppHandle) -> Result<Vec<MusicFile>, String> {
    load_json_file(&app_handle, PLAYLIST_FILE).or_else(|_| Ok(vec![]))
}

#[tauri::command]
#[auto_collect_command]
pub fn save_playlists(app_handle: AppHandle, mut playlists: Vec<Playlist>) -> Result<(), String> {
    ensure_system_playlists(&mut playlists);
    save_json_file(&app_handle, PLAYLISTS_FILE, &playlists)
}

#[tauri::command]
#[auto_collect_command]
pub fn load_playlists(app_handle: AppHandle) -> Result<Vec<Playlist>, String> {
    let mut playlists: Vec<Playlist> =
        load_json_file(&app_handle, PLAYLISTS_FILE).unwrap_or_default();
    ensure_system_playlists(&mut playlists);
    Ok(playlists)
}

#[tauri::command]
#[auto_collect_command]
pub fn save_settings(app_handle: AppHandle, settings: AppSettings) -> Result<(), String> {
    save_json_file(&app_handle, SETTINGS_FILE, &settings)
}

#[tauri::command]
#[auto_collect_command]
pub fn load_settings(app_handle: AppHandle) -> Result<AppSettings, String> {
    load_json_file(&app_handle, SETTINGS_FILE).or_else(|_| Ok(AppSettings::default()))
}

#[tauri::command]
#[auto_collect_command]
pub fn reveal_in_explorer(path: String) -> Result<(), String> {
    let path = PathBuf::from(&path);
    if !path.exists() {
        return Err("文件不存在".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path.to_string_lossy()])
            .spawn()
            .map_err(|e| format!("打开失败: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path.to_string_lossy()])
            .spawn()
            .map_err(|e| format!("打开失败: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path.parent().unwrap_or(&path))
            .spawn()
            .map_err(|e| format!("打开失败: {}", e))?;
    }

    Ok(())
}
