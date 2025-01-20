// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::{fs, env};
use std::process::Command;

#[tauri::command]
fn teraterm_login(ip: String, username: String, password: String, state: State<AppState>) -> Result<(), String> {
    let ttpmacro_path = &state.config.ttpmacro_path;
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
    let status = Command::new(ttpmacro_path)
        .arg(macro_path.to_str().unwrap())
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Tera Termマクロの実行に失敗しました。".into())
    }
}

#[tauri::command]
fn teraterm_login_su(
    ip: String,
    username: String,
    password: String,
    su_username: String,
    su_password: String,
    state: State<AppState>,
) -> Result<(), String> {
    let ttpmacro_path = &state.config.ttpmacro_path;
    // Tera Termマクロの内容を生成
    let macro_content = format!(
        r#"
        ; 接続情報
        HOSTADDR = '{ip}'
        USERNAME = '{username}'
        PASSWORD = '{password}'
        SU_USERNAME = '{su_username}'
        SU_PASSWORD = '{su_password}'

        ; コマンドオプション組立て
        COMMAND = HOSTADDR
        strconcat COMMAND ':22 /ssh /2 /auth=password /user='
        strconcat COMMAND USERNAME
        strconcat COMMAND ' /passwd='
        strconcat COMMAND PASSWORD

        ; 接続実行
        connect COMMAND

        ; 接続確認
        if result != 2 then
            messagebox '接続に失敗しました。'
            end
        endif

        ; suコマンドの実行
        wait '$'
        sendln 'su - {su_username}'
        wait 'パスワード'
        sendln '{su_password}'

        ; suコマンド成功確認（プロンプトが変わることを想定）
        wait '#'

        ; 必要な後続処理をここに記述可能
        sendln 'whoami'
        
        end
        "#,
        ip = ip,
        username = username,
        password = password,
        su_username = su_username,
        su_password = su_password,
    );

    // マクロファイルの保存先パス
    let macro_path = env::current_dir()
        .expect("現在の作業ディレクトリが取得できません")
        .join("login.ttl");

    // マクロファイルを書き込み
    fs::write(&macro_path, macro_content).map_err(|e| e.to_string())?;

    // Tera Termマクロ実行コマンド（ttpmacro.exe）
    let status = Command::new(ttpmacro_path)
        .arg(macro_path.to_str().unwrap())
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Tera Termマクロの実行に失敗しました。".into())
    }
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
struct Config {
    ttpmacro_path: String,
    server_data_api: String,
    user_data_api: String,
}

fn load_config() -> Config {
    // Tauri v2ではpath()を使用してリソースパスを解決
    let config_path = env::current_dir()
        .expect("現在の作業ディレクトリが取得できません")
        .join("config.toml");

    // 設定ファイルの内容を読み込む
    let config_content = fs::read_to_string(&config_path)
        .unwrap_or_else(|_| panic!("設定ファイルが見つからないか、読み込めません: {:?}", config_path));
    
    // TOML形式の内容をデシリアライズ
    toml::from_str(&config_content)
        .expect("設定ファイルのパースに失敗しました")
}

struct AppState {
    config: Config,
}


#[tauri::command]
fn get_config(state: tauri::State<AppState>) -> Config {
    state.config.clone()
}

use tauri::State;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = load_config();
    tauri::Builder::default()
        .manage(AppState { config })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![teraterm_login, teraterm_login_su, get_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
