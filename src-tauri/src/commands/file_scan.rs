use jwalk::{WalkDir};
use anyhow::{Context, Error, Result, anyhow, bail};
use serde_json::error;
use tauri_helper::auto_collect_command;
use std::path::Path;
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicFile {
    path: String,
    name: String,
}
// 定义支持的格式常量，方便管理
const SUPPORTED_EXTS: [&str; 3] = ["mp3", "wav", "flac"];


#[tauri::command()]
#[auto_collect_command]
pub fn add_music(target_file:String)->Result<MusicFile,String>{
    extract_filename(&target_file)
        .map(|name| MusicFile{
            path:target_file,
            name:name,
        })
        .map_err(|err| format!("Error:{}",err))

}


#[tauri::command()]
#[auto_collect_command]
pub fn scan_music(target_dir: String) -> Result<Vec<MusicFile>,String> {
    println!("targetdir:{target_dir}");
    let mut music_files: Vec<MusicFile> = Vec::new();
    for entry in WalkDir::new(target_dir){
        let Ok(entry) = entry else{continue};
        let path=entry.path();
        if !path.is_file(){ continue;}

        let file_name = entry.file_name().to_string_lossy().to_lowercase();
        if file_name.contains("mp3") || file_name.contains("wav") || file_name.contains("flac"){
            music_files.push(MusicFile { path: entry.path().to_string_lossy().to_string(),name:file_name});
        }        
    }
    
    println!("扫描完成，找到{}首歌", music_files.len());
    Ok(music_files)
}




fn extract_filename(path:&str)->Result<String>{
    Path::new(path)
        .file_stem()
        .ok_or_else(|| anyhow!("Extracting filename failed: {}", path))
        .map(|name| name.to_string_lossy().to_string())
}
