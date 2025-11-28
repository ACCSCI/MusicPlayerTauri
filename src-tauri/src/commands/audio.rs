use walkdir::WalkDir;
use std::path::Path;

#[tauri::command]
pub fn load_music_file() -> String {
    #[cfg(target_os = "windows")]
    let path = r"E:\CloudMusic\春庭雪 (DJ默涵版) - DJ晚风.flac";

    println!("后端被调用，返回路径: {}", path);
    path.to_string()
}

#[tauri::command]
pub fn get_music_path() -> String {
    #[cfg(target_os = "windows")]
    let path = r"E:\CloudMusic\春庭雪 (DJ默涵版) - DJ晚风.flac";

    println!("后端被调用，返回路径: {}", path);
    path.to_string()
}

#[tauri::command]
pub fn scan_music_folder(folder_path:String)->Vec<String>{
    let mut music_list=Vec::new();
    println!("开始扫描文件夹: {}",folder_path);

    //Recursive traversal of directory
    // WalkDir::new() 会自动帮我们把文件夹里所有的子文件夹都翻一遍（递归）
    // into_iter() 把它变成一个可以循环的东西
    for entry_result in WalkDir::new(folder_path).into_iter(){
      // 3. 处理“可能出错”的情况
      // 遍历文件可能会失败（比如没有权限读取某个文件）。
      // match 类似于 switch，但更强大。这里我们检查 entry_result 是 Ok(成功) 还是 Err(失败)。
      match entry_result{
        Ok(entry)=>{
          let path = entry.path();
          if path.is_file(){
            if let Some(extension) = path.extension(){
              let ext_str = extension.to_string_lossy().to_lowercase();
              if ext_str =="mp3"||ext_str=="flac"||ext_str=="wav"{
                  music_list.push(path.display().to_string());
              }
            }
          }
        }
        Err(_err)=>{
          // 如果读取出错，我们这里什么都不做，直接跳过
          // _err 前面的下划线告诉编译器：我知道有这个变量，但我不想用它，别警告我。
          continue;
        } 
      }
    }

  println!("扫描结束，找到了{}首音乐",music_list.len());
  music_list
}



#[tauri::command]
pub fn print_test() {
    println!("This is a test.");
}


