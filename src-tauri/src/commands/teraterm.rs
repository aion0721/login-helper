use tauri::State;
use crate::{AppState};
use encoding_rs::SHIFT_JIS;
use std::{fs, env};
use chrono::Local;
use std::process::Command;

#[tauri::command]
pub fn teraterm_login_su(
    ip: String,
    username: String,
    password: String,
    su_username: String,
    su_password: String,
    state: State<AppState>,
) -> Result<(), String> {
    let ttpmacro_path = &state.config.ttpmacro_path;

    // パスワードを「#ASCIIコード」形式に変換
    let ascii_password: String = password
        .as_bytes()
        .iter()
        .map(|&b| format!("#{}", b)) // 各バイトを「#ASCIIコード」に変換
        .collect::<Vec<String>>()
        .join(""); // 結合して1つの文字列に

    // パスワードを「#ASCIIコード」形式に変換
    let ascii_su_password: String = su_password
        .as_bytes()
        .iter()
        .map(|&b| format!("#{}", b)) // 各バイトを「#ASCIIコード」に変換
        .collect::<Vec<String>>()
        .join(""); // 結合して1つの文字列に

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
    
    let (encoded_content, _, had_errors) = SHIFT_JIS.encode(&macro_content);
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
    .expect("現在の作業ディレクトリが取得できません")
    .join(file_name);


    // マクロファイルを書き込み
    fs::write(&macro_path, encoded_content).map_err(|e| e.to_string())?;

    // Tera Termマクロ実行コマンド（ttpmacro.exe）
    let status = Command::new(ttpmacro_path)
        .arg(macro_path.to_str().unwrap())
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        // 処理成功時にTTLファイルを削除
        if let Err(e) = fs::remove_file(&macro_path) {
            eprintln!("ファイル削除に失敗しました: {}", e);
            return Err("処理は成功しましたが、ファイル削除に失敗しました。".into());
        }
        Ok(())
    } else {
        Err("Tera Termマクロの実行に失敗しました。".into())
    }
}
#[tauri::command]
pub fn teraterm_login(ip: String, username: String, password: String, state: State<AppState>) -> Result<(), String> {
    let ttpmacro_path = &state.config.ttpmacro_path;

    // パスワードを「#ASCIIコード」形式に変換
    let ascii_password: String = password
        .as_bytes()
        .iter()
        .map(|&b| format!("#{}", b)) // 各バイトを「#ASCIIコード」に変換
        .collect::<Vec<String>>()
        .join(""); // 結合して1つの文字列に

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

    let (encoded_content, _, had_errors) = SHIFT_JIS.encode(&macro_content);
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
    .expect("現在の作業ディレクトリが取得できません")
    .join(file_name);

    // マクロファイルを書き込み
    fs::write(&macro_path, encoded_content).map_err(|e| e.to_string())?;
    

    // Tera Termマクロ実行コマンド（ttpmacro.exe）
    let status = Command::new(ttpmacro_path)
        .arg(macro_path.to_str().unwrap())
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        // 処理成功時にTTLファイルを削除
        if let Err(e) = fs::remove_file(&macro_path) {
            eprintln!("ファイル削除に失敗しました: {}", e);
            return Err("処理は成功しましたが、ファイル削除に失敗しました。".into());
        }
        Ok(())
    } else {
        Err("Tera Termマクロの実行に失敗しました。".into())
    }
}
