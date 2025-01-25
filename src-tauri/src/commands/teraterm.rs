use crate::AppState;
use chrono::Local;
use encoding_rs::SHIFT_JIS;
use std::{env, fs};
use tauri::State;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;

/// Convert password to Tera Term macro-compatible ASCII representation
fn convert_password_to_macro_format(password: &str) -> String {
    password
        .chars()
        .map(|c| {
            // UTF-8でエンコードし、各バイトを#形式に変換
            format!("{}", c)
                .as_bytes()
                .iter()
                .map(|&b| format!("#{}", b))
                .collect::<String>()
        })
        .collect()
}

#[tauri::command]
pub async fn teraterm_login_su(
    app_handle: AppHandle,
    ip: String,
    username: String,
    password: String,
    su_username: String,
    su_password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let shell = app_handle.shell();
    let ttpmacro_path = &state.config.ttpmacro_path;

    // パスワードを「#ASCIIコード」形式に変換
    let ascii_password = convert_password_to_macro_format(&password);
    let ascii_su_password = convert_password_to_macro_format(&su_password);

    // Tera Termマクロの内容を生成
    let macro_content = format!(
        r#"
        ; 接続実行
        connect '{ip}:22 /ssh /2 /auth=password /user={username} /passwd="'{password}'"'

        ; 接続確認
        if result != 2 then
            messagebox '接続に失敗しました。'
            end
        endif

        ; suコマンドの実行
        wait '$'
        sendln 'su - {su_username}'
        wait 'パスワード'
        sendln {su_password}

        ; suコマンド成功確認（プロンプトが変わることを想定）
        wait '#'

        ; 必要な後続処理をここに記述可能
        sendln 'whoami'
        
        end
        "#,
        ip = ip,
        username = username,
        password = ascii_password,
        su_username = su_username,
        su_password = ascii_su_password,
    );

    // 共通の実行関数を呼び出し
    execute_teraterm_macro(&app_handle, &shell, ttpmacro_path, &macro_content).await
}
#[tauri::command]
pub async fn teraterm_login(
    app_handle: AppHandle,
    ip: String,
    username: String,
    password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let shell = app_handle.shell();
    let ttpmacro_path = &state.config.ttpmacro_path;

    // パスワードを「#ASCIIコード」形式に変換
    let ascii_password = convert_password_to_macro_format(&password);

    // Tera Termマクロの内容を生成
    let macro_content = format!(
        r#"
        ; 接続実行
        connect '{ip}:22 /ssh /2 /auth=password /user={username} /passwd="'{password}'"'
        end
        "#,
        ip = ip,
        username = username,
        password = ascii_password,
    );

    // 共通の実行関数を呼び出し
    execute_teraterm_macro(&app_handle, &shell, ttpmacro_path, &macro_content).await
}

pub async fn execute_teraterm_macro<R: tauri::Runtime>(
    app_handle: &AppHandle<R>,
    shell: &tauri_plugin_shell::Shell<R>,
    ttpmacro_path: &str,
    macro_content: &str,
) -> Result<(), String> {
    // Shift-JIS エンコーディング
    let (encoded_content, _, had_errors) = SHIFT_JIS.encode(macro_content);
    if had_errors {
        return Err("マクロのエンコードに失敗しました。".into());
    }

    // 現在の日付と時刻を取得（ミリ秒まで）
    let now = Local::now();
    let timestamp = now.format("%Y-%m-%d_%H-%M-%S.%3f").to_string();

    // 動的なファイル名を生成
    let file_name = format!("login_{}.ttl", timestamp);

    // マクロファイルの保存先パス
    let macro_path = env::current_dir()
        .map_err(|e| format!("Current directory error: {}", e))?
        .join(file_name);

    // マクロファイルを書き込み
    fs::write(&macro_path, encoded_content).map_err(|e| format!("File write error: {}", e))?;

    // Tera Termマクロ実行コマンド（ttpmacro.exe）
    let ttpmacro_status = shell
        .command(ttpmacro_path)
        .arg(macro_path.to_str().unwrap())
        .output()
        .await
        .map_err(|e| format!("Macro execution error: {}", e))?;

    if ttpmacro_status.status.success() {
        // 処理成功時にTTLファイルを削除
        if let Err(e) = fs::remove_file(&macro_path) {
            return Err(format!("File deletion failed: {}", e));
        }
        // イベント送信
        app_handle
            .emit("rust_event", "ログイン処理が完了しました。")
            .map_err(|e| format!("Failed to emit event: {}", e))?;

        Ok(())
    } else {
        Err("TeraTerm macro execution failed".into())
    }
}
