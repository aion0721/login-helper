import React, { useState } from "react";
import { Box, Button, Input, List, Stack, Text } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";

interface ServerInfo {
  sid: string;
  ip: string;
  hostname: string;
}

interface UserInfo {
  sid: string;
  hostname: string;
  id: string;
  password: string;
}

const App: React.FC = () => {
  // サーバ情報とユーザ情報のモックデータ

  // 状態管理
  const [sid, setSid] = useState<string>("");
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  // API呼び出し関数
  const fetchServerData = async () => {
    try {
      // APIリクエストを送信
      const response = await fetch(`http://rp.local:3000/server?sid=${sid}`, {
        method: "GET", // POSTリクエスト
        headers: {
          "Content-Type": "application/json", // JSON形式で送信
        },
      });

      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`); // ステータスコードが200以外の場合はエラー
      }

      const data = await response.json(); // 応答データをJSONとしてパース

      // 状態を更新
      setFilteredServers(data);
      setSelectedServer(null); // サーバ選択をリセット
      setFilteredUsers([]); // ユーザ情報もリセット
      setSelectedUser(null);
    } catch (err) {
      console.error("API呼び出しエラー:", err);
    }
  };

  // サーバ選択時の処理
  const handleServerSelect = async (server: ServerInfo) => {
    try {
      // サーバを選択状態に設定
      setSelectedServer(server);

      // APIからユーザーデータを取得
      const response = await fetch(
        `http://rp.local:3000/user?hostname=${server.hostname}`,
        {
          method: "GET", // 必要に応じて GET に変更
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // 応答が正常か確認
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }

      // JSONデータをパース
      const userData = await response.json();

      // ユーザーデータを状態にセット
      const filteredUsers = userData.filter(
        (user: UserInfo) =>
          user.sid === server.sid && user.hostname === server.hostname
      );
      setFilteredUsers(filteredUsers);
      setSelectedUser(null); // ユーザ選択をリセット

      console.log("取得したユーザーデータ:", filteredUsers);
    } catch (error) {
      console.error("API呼び出しエラー:", error);
    }
  };

  // ログインボタン押下時の処理
  const handleLogin = async (user: UserInfo) => {
    try {
      await invoke("teraterm_login", {
        ip: selectedServer?.ip,
        password: user.password,
        username: user.id,
      });
      alert("ログイン成功！");
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン失敗" + error);
    }
  };

  return (
    <Box p={5}>
      <Stack>
        {/* SID入力 */}
        <Input
          placeholder="Enter SID"
          value={sid}
          //onChange={(e) => handleFilter(e.target.value)}
          onChange={(e) => setSid(e.target.value)}
        />
        <Button onClick={fetchServerData}>aaa</Button>

        {/* サーバリスト */}
        <List.Root>
          {filteredServers.map((server) => (
            <List.Item key={server.ip}>
              <Button onClick={() => handleServerSelect(server)}>
                {server.hostname} ({server.ip})
              </Button>
            </List.Item>
          ))}
        </List.Root>

        {/* ユーザ情報 */}
        {selectedServer && (
          <>
            <Text>ユーザ情報:</Text>
            <List.Root>
              {filteredUsers.map((user) => (
                <List.Item key={user.id}>
                  <Button onClick={() => setSelectedUser(user)}>
                    {user.id}
                  </Button>
                </List.Item>
              ))}
            </List.Root>
          </>
        )}

        {/* ログインボタン */}
        {selectedUser && (
          <Button colorScheme="blue" onClick={() => handleLogin(selectedUser)}>
            Login
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default App;
