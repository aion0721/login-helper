use serde::{Deserialize, Serialize};
use std::{env, fs};
use tauri::State;
use ts_rs::TS;

#[derive(Deserialize, Serialize, Clone, TS)]
#[ts(export)]
pub struct Config {
    pub ttpmacro_path: String,
    pub server_data_api: String,
    pub user_data_api: String,
    pub default_login_user: String,
    pub default_login_su: String,
    pub default_login_win: String,
    pub default_login_oc: String,
}

pub fn load_config() -> Config {
    // Tauri v2ではpath()を使用してリソースパスを解決
    let config_path = env::current_dir()
        .expect("現在の作業ディレクトリが取得できません")
        .join("config.toml");

    // 設定ファイルの内容を読み込む
    let config_content = fs::read_to_string(&config_path).unwrap_or_else(|_| {
        panic!(
            "設定ファイルが見つからないか、読み込めません: {:?}",
            config_path
        )
    });

    // TOML形式の内容をデシリアライズ
    toml::from_str(&config_content).expect("設定ファイルのパースに失敗しました")
}

// TauriコマンドとしてConfigを取得
#[tauri::command]
pub fn get_config(state: State<AppState>) -> Config {
    state.config.clone()
}

// AppState構造体もここに移動
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
}
