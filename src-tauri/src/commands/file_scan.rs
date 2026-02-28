use crate::models::MusicFile;
use anyhow::{anyhow, bail, Context, Error, Result};
use jwalk::WalkDir;
use serde_json::error;
use std::path::Path;
use tauri_helper::auto_collect_command;

// 定义支持的格式常量，方便管理
const SUPPORTED_EXTS: [&str; 4] = ["mp3", "wav", "flac", "m4a"];

#[tauri::command]
#[auto_collect_command]
pub fn add_music(target_file: String) -> Result<MusicFile, String> {
    extract_filename(&target_file)
        .map(|name| MusicFile {
            path: target_file,
            name: name,
            is_online: None,
            bv_id: None,
            page: None,
        })
        .map_err(|err| format!("Error:{}", err))
}

#[tauri::command()]
#[auto_collect_command]
pub async fn scan_music(target_dir: String) -> Result<Vec<MusicFile>, String> {
    let target_dir = target_dir.clone();
    let result = tokio::task::spawn_blocking(move || {
        println!("targetdir:{}", target_dir);
        let mut music_files: Vec<MusicFile> = Vec::new();
        for entry in WalkDir::new(&target_dir) {
            let Ok(entry) = entry else { continue };
            let path = entry.path();
            if !path.is_file() {
                continue;
            }

            if let Some(extension) = path.extension() {
                let ext = extension.to_string_lossy().to_lowercase();
                if SUPPORTED_EXTS.contains(&ext.as_str()) {
                    music_files.push(MusicFile {
                        path: path.to_string_lossy().to_string(),
                        name: entry.file_name().to_string_lossy().to_string(),
                        is_online: None,
                        bv_id: None,
                        page: None,
                    });
                }
            }
        }
        println!("扫描完成，找到{}首歌", music_files.len());
        music_files
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?;

    Ok(result)
}

fn extract_filename(path: &str) -> Result<String> {
    Path::new(path)
        .file_stem()
        .ok_or_else(|| anyhow!("Extracting filename failed: {}", path))
        .map(|name| name.to_string_lossy().to_string())
}
