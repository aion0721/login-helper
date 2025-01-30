// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
mod commands;
mod config;

use config::{get_config, load_config, AppState};

#[tauri::command]
fn get_user() -> String {
    match std::env::var("username") {
        Ok(user) => user,
        Err(_) => "Unknown".to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = load_config();
    tauri::Builder::default()
        .manage(AppState { config })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::teraterm::teraterm,
            commands::rdp::rdp_login,
            get_config,
            get_user
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
