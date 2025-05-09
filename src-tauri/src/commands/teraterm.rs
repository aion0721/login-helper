use crate::get_user;
use crate::AppState;
use chrono::Local;
use encoding_rs::SHIFT_JIS;
use std::path::PathBuf;
use std::{env, fs};
use tauri::State;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;

/// Convert password to Tera Term macro-compatible ASCII representation
/// If `login_flag` is true, double quotes in the password are doubled.
fn convert_password_to_macro_format(password: &str, login_flag: bool) -> String {
    password
        .chars()
        .map(|c| {
            let mut encoded = c.to_string();

            // If login_flag is true and the character is a double quote, double it
            if login_flag && c == '"' {
                encoded.push('"');
            }

            // Encode each byte of the character in #<ASCII code> format
            encoded
                .as_bytes()
                .iter()
                .map(|&b| format!("#{}", b))
                .collect::<String>()
        })
        .collect()
}

#[tauri::command]
pub async fn teraterm(
    app_handle: AppHandle,
    ip: String,
    username: String,
    password: String,
    sid: String,
    hostname: String,
    memo: String,
    su_username: Option<String>, // su_usernameはオプション型に
    su_password: Option<String>, // su_passwordもオプション型に
    is_su: Option<bool>,         // suコマンドを実行するかどうかのフラグ（オプション型）
    is_script: Option<bool>,     // suコマンドを実行するかどうかのフラグ（オプション型）
    oc_url: Option<String>,      // oc_urlはオプション型に
    oc_user: Option<String>,     // oc_userもオプション型に
    oc_password: Option<String>, // oc_passwordもオプション型に
    bg_color: String,            // bg_colorもオプション型に
    is_oc: Option<bool>,         // ocコマンドを実行するかどうかのフラグ（オプション型）
    state: State<'_, AppState>,
) -> Result<(), String> {
    let shell = app_handle.shell();
    let ttpmacro_path = &state.config.ttpmacro_path;
    let login_username = get_user();

    // 現在の日付と時刻を取得（ミリ秒まで）
    let now = Local::now();
    let timestamp = now.format("%Y%m%d%H%M").to_string();

    // is_suが未定義の場合はデフォルトでfalse
    let is_su = is_su.unwrap_or(false);
    let is_oc = is_oc.unwrap_or(false);
    let is_script = is_script.unwrap_or(true);

    // パスワードを「#ASCIIコード」形式に変換
    let ascii_password = convert_password_to_macro_format(&password, true);
    let ascii_su_password = su_password
        .as_ref()
        .filter(|_| is_su) // is_suがtrueの場合のみ処理を継続
        .map(|p| convert_password_to_macro_format(p, false))
        .unwrap_or_default(); // デフォルト値として空文字列

    // 動的なファイル名を生成
    let ini_filename = match std::env::var("username") {
        Ok(username) => format!("teraterm_ini_{}.ini", username),
        Err(e) => {
            eprintln!("Failed to get username: {}", e);
            "teraterm_ini_default.ini".to_string() // デフォルト値を返す
        }
    };

    // マクロファイルの保存先パス
    let ini_path = env::current_dir()
        .map_err(|e| format!("Current directory error: {}", e))?
        .join(ini_filename);

    // ベースとなるTera Termマクロの内容
    let mut macro_content = format!(
        r#"
        ; 接続実行
        connect '{ip}:22 /ssh /2 /auth=password /user={username} /passwd="'{password}'" /F={ini_path}'
        "#,
        ip = ip,
        username = username,
        password = ascii_password,
        ini_path = ini_path.to_string_lossy()
    );

    if is_script {
        let script_do = format!(
            r#"
            ; suコマンドの実行
            wait '$'
            sendln 'script /tmp/teraterm_`hostname`_{login_username}_{timestamp}.log'
            "#,
            login_username = login_username,
            timestamp = timestamp
        );
        macro_content.push_str(&script_do);
    }

    // is_suがtrueの場合、suコマンド処理を追記
    if is_su {
        let su_commands = format!(
            r#"
            ; suコマンドの実行
            wait '$'
            sendln 'su - {su_username}'
            wait 'パスワード'
            sendln {su_password}

            ; suコマンド成功確認（プロンプトが変わることを想定）
            wait '#'

            ; 必要な後続処理をここに記述可能
            sendln 'whoami'
            wait '#'
            "#,
            su_username = su_username.unwrap_or_else(|| "".to_string()),
            su_password = ascii_su_password,
        );
        macro_content.push_str(&su_commands);
    }

    //is_ocがtrueの場合、ocコマンド処理を追記
    if is_oc {
        let oc_commands = format!(
            r#"
            ; suコマンドの実行
            sendln "oc login {oc_url} --username {oc_user} --password '{oc_password}'"

            ; suコマンド成功確認（プロンプトが変わることを想定）
            wait '#'
            "#,
            oc_url = oc_url.unwrap_or_else(|| "".to_string()),
            oc_user = oc_user.unwrap_or_else(|| "".to_string()),
            oc_password = oc_password.unwrap_or_else(|| "".to_string()),
        );
        macro_content.push_str(&oc_commands);
    }

    let set_title = format!(
        r#"
        ; ウィンドウタイトル変更
        settitle '[{sid}] {hostname} ({memo})'

        "#,
        sid = sid,
        hostname = hostname,
        memo = memo,
    );
    macro_content.push_str(&set_title);

    // 最後にendを追加
    macro_content.push_str("\nend\n");

    // 共通の実行関数を呼び出し
    execute_teraterm_macro(
        &app_handle,
        &shell,
        ttpmacro_path,
        &macro_content,
        &ini_path,
        &bg_color,
    )
    .await
}

pub async fn execute_teraterm_macro<R: tauri::Runtime>(
    app_handle: &AppHandle<R>,
    shell: &tauri_plugin_shell::Shell<R>,
    ttpmacro_path: &str,
    macro_content: &str,
    ini_path: &PathBuf, // 新しい引数を追加
    bg_color: &str,
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

    // Create INI
    let background_color = format!("VTColor=255,255,255,{}", bg_color);

    // テンプレートファイルのパスを取得
    let template_path = env::current_dir()
        .map_err(|e| format!("Current directory error: {}", e))?
        .join("template.ini");

    // 動的なファイル名を生成
    //let output_path = PathBuf::from(ttpmacro_path).join("teraterm_lh.ttl");

    // テンプレートファイルを読み込む
    let content = fs::read_to_string(&template_path)
        .map_err(|e| format!("Failed to read template file: {}", e))?;

    // "VTColor" の行を "VTColor=1111" に置換
    let updated_content = content
        .lines()
        .map(|line| {
            if line.starts_with("VTColor") {
                background_color.to_string()
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<String>>()
        .join("\n");

    // マクロファイルを書き込み
    fs::write(&ini_path, &updated_content).map_err(|e| format!("File write error: {}", e))?;

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
        if let Err(e) = fs::remove_file(&ini_path) {
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
