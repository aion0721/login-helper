import React, { useState } from "react";
import { Box, Button, Input, Stack, Text, Table } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import { CiEraser, CiLock, CiSearch, CiServer } from "react-icons/ci";

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

const Home: React.FC = () => {
  // サーバ情報とユーザ情報のモックデータ

  // 状態管理
  const [sid, setSid] = useState<string>("");
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [selectedSuUser, setSelectedSuUser] = useState<UserInfo | null>(null);

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
      setSelectedSuUser(null);
    } catch (err) {
      console.error("API呼び出しエラー:", err);
    }
  };

  const handleClear = () => {
    setSid("");
    setFilteredServers([]);
    setSelectedServer(null);
    setFilteredUsers([]);
    setSelectedUser(null);
    setSelectedSuUser(null);
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
      setSelectedSuUser(null); // ユーザ選択をリセット

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

  // ログインボタン押下時の処理
  const handleLoginSu = async (user: UserInfo, suUser: UserInfo) => {
    try {
      await invoke("teraterm_login_su", {
        ip: selectedServer?.ip,
        password: user.password,
        username: user.id,
        suUsername: suUser.id, // suユーザ名
        suPassword: suUser.password, // suユーザのパスワード
      });
      alert("ログイン成功！");
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン失敗" + error);
    }
  };

  const handleSelectUser = (user: UserInfo) => {
    setSelectedUser(user);
    setSelectedSuUser(null);
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
        <Button colorPalette="teal" onClick={fetchServerData}>
          <CiSearch />
          Search SID
        </Button>
        <Button onClick={handleClear}>
          <CiEraser />
          CLEAR
        </Button>

        {filteredServers && (
          <>
            <Text mb={4}>Server List: {selectedServer?.hostname}</Text>
            <Table.Root size="md">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Hostname</Table.ColumnHeader>
                  <Table.ColumnHeader>IP Address</Table.ColumnHeader>
                  <Table.ColumnHeader>Action</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredServers.map((server) => (
                  <Table.Row key={server.ip}>
                    <Table.Cell>{server.hostname}</Table.Cell>
                    <Table.Cell>{server.ip}</Table.Cell>
                    <Table.Cell>
                      <Button
                        colorScheme="teal"
                        onClick={() => handleServerSelect(server)}
                      >
                        Select
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </>
        )}

        {/* サーバリスト */}

        {selectedServer && (
          <>
            <Text mb={4}>ユーザ情報: {selectedUser?.id}</Text>
            <Box overflowX="auto">
              <Table.Root size="md">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>User ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Action</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredUsers.map((user) => (
                    <Table.Row key={user.id}>
                      <Table.Cell>{user.id}</Table.Cell>
                      <Table.Cell>
                        <Button
                          colorScheme="teal"
                          variant="surface"
                          onClick={() => handleSelectUser(user)}
                        >
                          Select
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </>
        )}

        {/* ログインボタン */}
        {selectedUser && (
          <Button colorPalette="teal" onClick={() => handleLogin(selectedUser)}>
            <CiServer />
            Login
          </Button>
        )}

        {/* ユーザ情報 */}
        {selectedUser && (
          <>
            <Text mb={4}>SU ユーザ情報: {selectedSuUser?.id}</Text>
            <Box overflowX="auto">
              <Table.Root size="md">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>User ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Action</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredUsers.map((user) => (
                    <Table.Row key={user.id}>
                      <Table.Cell>{user.id}</Table.Cell>
                      <Table.Cell>
                        <Button
                          colorScheme="teal"
                          variant="surface"
                          onClick={() => setSelectedSuUser(user)}
                        >
                          Select
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* ログインボタン */}
            {selectedSuUser && (
              <Button
                colorPalette="teal"
                onClick={() => handleLoginSu(selectedUser, selectedSuUser)}
              >
                <CiLock />
                Su Login
              </Button>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};

export default Home;
