import React, { useEffect, useState } from "react";
import { Box, Button, Input, Stack, Text, Table } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import {
  CiEraser,
  CiLock,
  CiSearch,
  CiServer,
  CiViewList,
} from "react-icons/ci";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router";

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

interface Config {
  ttpmacro_path: string;
  server_data_api: string;
  user_data_api: string;
  default_login_user: string;
  default_login_su: string;
}

const Home: React.FC = () => {
  const { Sid, setSid, selectedServer, setSelectedServer } = useAppContext();
  const [config, setConfig] = React.useState<Config | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchConfig() {
      try {
        const result = await invoke<Config>("get_config");
        setConfig(result);
      } catch (err) {
        console.error("API呼び出しエラー:", err);
      }
    }
    fetchConfig();
  }, []);

  // サーバ情報とユーザ情報のモックデータ

  // 状態管理
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([]);

  // API呼び出し関数
  const fetchServerData = async () => {
    try {
      // APIリクエストを送信
      const response = await fetch(`${config?.server_data_api}${Sid}`, {
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
    } catch (err) {
      console.error("API呼び出しエラー:", err);
    }
  };

  const handleClear = () => {
    setSid("");
    setFilteredServers([]);
    setSelectedServer(null);
  };

  // サーバ選択時の処理
  const handleServerSelect = async (server: ServerInfo) => {
    try {
      // サーバを選択状態に設定
      setSelectedServer(server);

      // APIからユーザーデータを取得
      const response = await fetch(
        `${config?.user_data_api}${server.hostname}`,
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

      console.log("取得したユーザーデータ:", filteredUsers);
    } catch (error) {
      console.error("API呼び出しエラー:", error);
    }
    navigate("/server");
  };

  // ログインボタン押下時の処理
  const handleLogin = async (server: ServerInfo) => {
    try {
      const response = await fetch(
        `${config?.user_data_api}${server?.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const users: UserInfo[] = await response.json();

      const defaultUser = users.find(
        (user) => user.id === config?.default_login_user
      );

      if (!defaultUser) {
        console.log(response);
        throw new Error("デフォルトユーザが見つかりません");
      }

      await invoke("teraterm_login", {
        ip: server?.ip,
        password: defaultUser.password,
        username: defaultUser.id,
      });
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン失敗" + error);
    }
  };

  // ログインボタン押下時の処理
  const handleLoginSu = async (server: ServerInfo) => {
    try {
      const response = await fetch(
        `${config?.user_data_api}${server?.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const users: UserInfo[] = await response.json();

      const defaultUser = users.find(
        (user) => user.id === config?.default_login_user
      );

      if (!defaultUser) {
        console.log(response);
        throw new Error("デフォルトユーザが見つかりません");
      }
      // SUユーザーを検索
      const suUser = users.find((user) => user.id === config?.default_login_su);
      if (!suUser) {
        throw new Error("SUユーザが見つかりません");
      }

      await invoke("teraterm_login_su", {
        ip: server?.ip,
        password: defaultUser.password,
        username: defaultUser.id,
        suUsername: suUser.id, // suユーザ名
        suPassword: suUser.password, // suユーザのパスワード
      });
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン失敗" + error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchServerData();
    }
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
            onKeyDown={handleKeyDown}
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
                        <Stack direction="row" justify="center">
                          <Button
                            colorPalette="cyan"
                            onClick={() => handleLogin(server)}
                          >
                            <CiServer />
                            Login
                          </Button>
                          <Button
                            colorPalette="teal"
                            onClick={() => handleLoginSu(server)}
                          >
                            <CiLock />
                            SuLogin
                          </Button>
                          <Button
                            colorPalette="yellow"
                            onClick={() => handleServerSelect(server)}
                          >
                            <CiViewList />
                            Detail
                          </Button>
                        </Stack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </>
          )}
        </Stack>
      </Box>
    </motion.div>
  );
};

export default Home;
