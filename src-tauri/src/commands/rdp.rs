use std::process::Command;

#[tauri::command]
pub fn rdp_login(
	ip: String,
	username: String,
	password: String,
) {
    // 資格情報を登録
    Command::new("cmdkey")
        .args(&[
            &format!("/generic:TERMSRV/{}", ip),
            &format!("/user:{}", username),
            &format!("/pass:{}", password),
        ])
        .status()
        .expect("資格情報の登録に失敗しました");

    // RDPセッションを開始
    Command::new("mstsc")
        .args(&[&format!("/v:{}", ip)])
        .status()
        .expect("RDPセッションの開始に失敗しました");

    // 資格情報を削除
    Command::new("cmdkey")
        .args(&[&format!("/delete:TERMSRV/{}", ip)])
        .status()
        .expect("資格情報の削除に失敗しました");
    println!("RDPセッションが開始されました！");
}
