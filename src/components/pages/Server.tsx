import React, { useEffect, useState } from "react";
import { Box, Button, Input, Stack, Text, Table } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import { CiEraser, CiLock, CiSearch, CiServer } from "react-icons/ci";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";

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

const Server: React.FC = () => {
  const { Sid, selectedServer, setSelectedServer } = useAppContext();
  const [config, setConfig] = React.useState<Config | null>(null);

  // サーバ情報とユーザ情報のモックデータ

  // 状態管理
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [selectedSuUser, setSelectedSuUser] = useState<UserInfo | null>(null);
  const [defaultLoginUser, setDefaultLoginUser] = useState<string>("");
  const [defaultLoginSu, setDefaultLoginSu] = useState<string>("");

  // サーバ選択時の処理
  const fetchData = async (server: ServerInfo) => {
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
      setUsers(filteredUsers);
      // 条件に応じて selectedUser と selectedSuUser を設定
      userData.forEach((user: UserInfo) => {
        if (user.id === defaultLoginUser) {
          setSelectedUser(user); // id が 'pi' の場合
        } else if (user.id === defaultLoginSu) {
          setSelectedSuUser(user); // id が 'root' の場合
        }
      });

      console.log("取得したユーザーデータ:", filteredUsers);
    } catch (error) {
      console.error("API呼び出しエラー:", error);
    }
  };

  useEffect(() => {
    async function fetchConfig() {
      try {
        const result = await invoke<Config>("get_config");
        setConfig(result);
        setDefaultLoginUser(result.default_login_user);
        setDefaultLoginSu(result.default_login_su);
      } catch (err) {
        console.error("API呼び出しエラー:", err);
      }
    }
    fetchConfig();
  }, []);
  useEffect(() => {
    if (selectedServer && defaultLoginUser && defaultLoginSu) {
      fetchData(selectedServer); // Configが取得された後にのみ実行
    }
  }, [selectedServer, defaultLoginUser, defaultLoginSu]); // 依存関係を追加

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }} // 初期状態: 右からスライドイン
      animate={{ opacity: 1, x: 0 }} // アニメーション後: 表示位置
      exit={{ opacity: 0, x: -100 }} // ページ離脱時: 左へスライドアウト
      transition={{ duration: 0.5 }} // アニメーション速度
    >
      <Box p={5}>
        <Box>{selectedServer?.hostname}</Box>
        <Stack>
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Label</Table.ColumnHeader>
                <Table.ColumnHeader>Value</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Sid</Table.Cell>
                <Table.Cell>{Sid}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>IP</Table.Cell>
                <Table.Cell>{selectedServer?.ip}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Hostname</Table.Cell>
                <Table.Cell>{selectedServer?.hostname}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>LoginUsers</Table.Cell>
                <Table.Cell>
                  {selectedUser?.id} / {selectedUser?.password}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>SuUsers</Table.Cell>
                <Table.Cell>
                  {selectedSuUser?.id} / {selectedSuUser?.password}
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
          {/* サーバリスト */}

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

export default Server;
