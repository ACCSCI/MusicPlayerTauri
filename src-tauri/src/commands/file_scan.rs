use jwalk::{WalkDir};
use anyhow::Result;
use tauri_helper::auto_collect_command;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicFile {
    path: String,
    name: String,
}

#[tauri::command(rename_all = "snake_case")]
#[auto_collect_command]
pub fn scan_music(target_dir: String) -> Vec<MusicFile> {
    println!("targetdir:{target_dir}");
    let mut music_files: Vec<MusicFile> = Vec::new();

    for entry in WalkDir::new(target_dir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if let Some(extension) = path.extension() {
                let ext_str = extension.to_string_lossy().to_lowercase();
                if ext_str == "mp3" || ext_str == "flac" || ext_str == "wav" {
                    music_files.push(MusicFile {
                        path: path.to_string_lossy().to_string(),
                        name: path.file_name().unwrap().to_string_lossy().to_string(),
                    });
                }
            }
        }
    }
    println!("扫描完成，找到{}首歌", music_files.len());
    music_files
}





