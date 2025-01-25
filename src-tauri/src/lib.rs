// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::{env};
mod commands;
mod config;

use config::{AppState, load_config, get_config};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = load_config();
    tauri::Builder::default()
        .manage(AppState { config })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![commands::teraterm::teraterm_login, commands::teraterm::teraterm_login_su, get_config, commands::rdp::rdp_login])  
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
