use serde::{Deserialize, Serialize};

// 以后如果有其他公用的结构体（比如 AI 的向量数据），也都放这里
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MusicFile {
    pub path: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub is_online: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub songs: Vec<MusicFile>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_system: Option<bool>,
}
