// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
mod commands;
mod config;

use config::{get_config, load_config, AppState};

use tauri::{
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

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
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::Manager; // Managerトレイトのインポート必須
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let ctrl_n_shortcut =
                    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyE);
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            if shortcut == &ctrl_n_shortcut {
                                if let ShortcutState::Pressed = event.state() {
                                    // Option型の処理に変更
                                    if let Some(main_window) = app.get_webview_window("main") {
                                        if main_window.is_minimized().unwrap_or(false) {
                                            let _ = main_window.unminimize();
                                        }
                                        let _ = main_window.show();
                                        let _ = main_window.set_focus();
                                    }
                                }
                            }
                        })
                        .build(),
                )?;
                app.global_shortcut().register(ctrl_n_shortcut)?;
            }

            // ここから新しいコードを追加
            let _tray_icon = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)
                .expect("Failed to build tray icon");

            Ok(())
        })
        .on_window_event(|app, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let app_handle = app.app_handle();
                let window = app_handle.get_webview_window("main").unwrap();
                window.hide().unwrap();
                api.prevent_close(); // ウィンドウのクローズを防ぎ、非表示にする
            }
        })
        .on_tray_icon_event(|app, event| match event {
            TrayIconEvent::DoubleClick { .. } => {
                let app_handle = app.app_handle();
                let window = app_handle.get_webview_window("main").unwrap();
                window.show().unwrap(); // トレイアイコンのダブルクリックでウィンドウを表示
                window.set_focus().unwrap();
            }
            _ => {}
        })
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
