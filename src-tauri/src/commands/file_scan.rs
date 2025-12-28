use crate::models::MusicFile;
use anyhow::{anyhow, bail, Context, Error, Result};
use jwalk::WalkDir;
use serde_json::error;
use std::path::Path;
use tauri_helper::auto_collect_command;

// 定义支持的格式常量，方便管理
const SUPPORTED_EXTS: [&str; 3] = ["mp3", "wav", "flac"];

#[tauri::command]
#[auto_collect_command]
pub fn add_music(target_file: String) -> Result<MusicFile, String> {
    extract_filename(&target_file)
        .map(|name| MusicFile {
            path: target_file,
            name: name,
        })
        .map_err(|err| format!("Error:{}", err))
}

#[tauri::command()]
#[auto_collect_command]
pub fn scan_music(target_dir: String) -> Result<Vec<MusicFile>, String> {
    println!("targetdir:{target_dir}");
    let mut music_files: Vec<MusicFile> = Vec::new();
    for entry in WalkDir::new(target_dir) {
        let Ok(entry) = entry else { continue };
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        if let Some(extension) = path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            if ext == "mp3" || ext == "wav" || ext == "flac" {
                music_files.push(MusicFile {
                    path: path.to_string_lossy().to_string(),
                    // 建议：这里最好存原始文件名 entry.file_name()，而不是转小写后的，
                    // 这样界面显示更好看，但为了最小修改保持原有逻辑，我还是用了 string_lossy
                    name: entry.file_name().to_string_lossy().to_string(),
                });
            }
        }
    }
    println!("扫描完成，找到{}首歌", music_files.len());
    Ok(music_files)
}

fn extract_filename(path: &str) -> Result<String> {
    Path::new(path)
        .file_stem()
        .ok_or_else(|| anyhow!("Extracting filename failed: {}", path))
        .map(|name| name.to_string_lossy().to_string())
}
