// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use std::fs;
use std::env;
use std::process::Command;

#[tauri::command]
fn teraterm_login(ip: String, username: String, password: String) -> Result<(), String> {
    // Tera Termマクロの内容を生成
    let macro_content = format!(
        r#"
        ; 接続情報
        HOSTADDR = '{ip}'
        USERNAME = '{username}'
        PASSWORD = '{password}'

        ; コマンドオプション組立て
        COMMAND = HOSTADDR
        strconcat COMMAND ':22 /ssh /2 /auth=password /user='
        strconcat COMMAND USERNAME
        strconcat COMMAND ' /passwd='
        strconcat COMMAND PASSWORD

        ; 接続実行
        connect COMMAND
        end
        "#,
        ip = ip,
        username = username,
        password = password,
    );

    // マクロファイルの保存先パス
    let macro_path = env::current_dir()
    .expect("現在の作業ディレクトリが取得できません")
    .join("login.ttl");

    // マクロファイルを書き込み
    fs::write(&macro_path, macro_content).map_err(|e| e.to_string())?;

    // Tera Termマクロ実行コマンド（ttpmacro.exe）
    let status = Command::new("C:\\Program Files (x86)\\teraterm\\ttpmacro.exe")
        .arg(macro_path.to_str().unwrap())
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Tera Termマクロの実行に失敗しました。".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, teraterm_login])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
