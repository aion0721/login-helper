// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn login_command(id: String, password: String, hostname: String) -> Result<(), String> {
    println!("Logging in with ID={} to Hostname={} using Password={}", id, hostname, password);
    // 実際のログイン処理をここに実装（例：外部コマンド呼び出しなど）
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, login_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
