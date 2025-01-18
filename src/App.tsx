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
  const serverData: ServerInfo[] = [
    { sid: "123", ip: "192.168.1.1", hostname: "Server1" },
    { sid: "456", ip: "192.168.1.2", hostname: "Server2" },
    { sid: "123", ip: "192.168.1.3", hostname: "Server3" },
  ];

  const userData: UserInfo[] = [
    { sid: "123", hostname: "Server1", id: "user1", password: "pass1" },
    { sid: "123", hostname: "Server3", id: "user2", password: "pass2" },
    { sid: "456", hostname: "Server2", id: "user3", password: "pass3" },
  ];

  // 状態管理
  const [sid, setSid] = useState<string>("");
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  // SID入力時のフィルタリング処理
  const handleFilter = (inputSid: string) => {
    setSid(inputSid);
    const servers = serverData.filter((server) => server.sid === inputSid);
    setFilteredServers(servers);
    setSelectedServer(null); // サーバ選択をリセット
    setFilteredUsers([]); // ユーザ情報もリセット
    setSelectedUser(null);
  };

  // サーバ選択時の処理
  const handleServerSelect = (server: ServerInfo) => {
    setSelectedServer(server);
    const users = userData.filter(
      (user) => user.sid === server.sid && user.hostname === server.hostname
    );
    setFilteredUsers(users);
    setSelectedUser(null); // ユーザ選択をリセット
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
          onChange={(e) => handleFilter(e.target.value)}
        />

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
