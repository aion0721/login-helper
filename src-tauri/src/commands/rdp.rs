use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn rdp_login(
    app_handle: AppHandle,
    ip: String,
    username: String,
    password: String,
) -> Result<(), String> {
    let shell = app_handle.shell();

    // 資格情報を登録
    let cmdkey_add_output = shell
        .command("cmdkey")
        .args(&[
            &format!("/generic:TERMSRV/{}", ip),
            &format!("/user:{}", username),
            &format!("/pass:{}", password),
        ])
        .output()
        .await
        .map_err(|e| format!("Credential add failed: {}", e))?;

    if !cmdkey_add_output.status.success() {
        return Err(format!(
            "Failed to add credential. Exit code: {}",
            cmdkey_add_output.status.code().unwrap_or(-1)
        ));
    }

    // RDPセッションを開始
    let rdp_output = shell
        .command("mstsc")
        .args(&[&format!("/v:{}", ip)])
        .output()
        .await
        .map_err(|e| format!("RDP session failed: {}", e))?;

    if !rdp_output.status.success() {
        return Err(format!(
            "RDP session failed. Exit code: {}",
            rdp_output.status.code().unwrap_or(-1)
        ));
    }

    // 資格情報を削除
    let cmdkey_delete_output = shell
        .command("cmdkey")
        .args(&[&format!("/delete:TERMSRV/{}", ip)])
        .output()
        .await
        .map_err(|e| format!("Credential deletion failed: {}", e))?;

    if !cmdkey_delete_output.status.success() {
        return Err(format!(
            "Failed to delete credential. Exit code: {}",
            cmdkey_delete_output.status.code().unwrap_or(-1)
        ));
    }

    Ok(())
}