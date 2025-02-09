// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
mod commands;
mod config;

use config::{get_config, load_config, AppState};

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
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
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };
                let show_window_shortcut =
                    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyE);

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            println!("{:?}", shortcut);
                            if shortcut == &show_window_shortcut {
                                match event.state() {
                                    ShortcutState::Pressed => {
                                        let app_handle = app.app_handle();
                                        let window = app_handle.get_webview_window("main").unwrap();
                                        window.show().unwrap(); // トレイアイコンのダブルクリックでウィンドウを表示
                                        window.set_focus().unwrap();
                                    }
                                    // releasedは不要なのでDefaultCaseにまとめる
                                    _ => {}
                                }
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(show_window_shortcut)?;
            }

            // SystemTray関連
            let open_i = MenuItem::with_id(app, "open", "表示", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?; // セパレーターを作成
            let menu = Menu::with_items(app, &[&open_i, &separator, &quit_i])?;

            let _tray_icon = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("LoginHelper")
                .show_menu_on_left_click(false)
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
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "open" => {
                let app_handle = app.app_handle();
                let window = app_handle.get_webview_window("main").unwrap();
                window.show().unwrap(); // トレイアイコンのダブルクリックでウィンドウを表示
                window.set_focus().unwrap();
            }
            _ => {
                println!("menu item{:?} not handled", event.id);
            }
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
