import React, { useState } from "react";
import { Box, Button, Input, Stack, Text, Table } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import { CiEraser, CiLock, CiSearch, CiServer } from "react-icons/ci";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { Navigate, useNavigate } from "react-router";

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
  const { Sid, setSid, selectedServer, setSelectedServer } = useAppContext();
  const navigate = useNavigate();

  // サーバ情報とユーザ情報のモックデータ

  // 状態管理
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [selectedSuUser, setSelectedSuUser] = useState<UserInfo | null>(null);

  // API呼び出し関数
  const fetchServerData = async () => {
    try {
      // APIリクエストを送信
      const response = await fetch(`http://rp.local:3000/server?sid=${Sid}`, {
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
    navigate("/server");
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
    <motion.div
      initial={{ opacity: 0, x: 100 }} // 初期状態: 右からスライドイン
      animate={{ opacity: 1, x: 0 }} // アニメーション後: 表示位置
      exit={{ opacity: 0, x: -100 }} // ページ離脱時: 左へスライドアウト
      transition={{ duration: 0.5 }} // アニメーション速度
    >
      <Box p={5}>
        <Stack>
          {/* SID入力 */}
          <Input
            placeholder="Enter SID"
            value={Sid}
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
            <Button
              colorPalette="teal"
              onClick={() => handleLogin(selectedUser)}
            >
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
    </motion.div>
  );
};

export default Home;
