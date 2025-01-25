import React, { useEffect, useState } from "react";
import { Box, Button, Stack, Table } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import { CiLock, CiServer } from "react-icons/ci";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import type { Config } from "../../types/Config";

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

const Server: React.FC = () => {
  const { selectedServer } = useAppContext();

  // サーバ情報とユーザ情報のモックデータ

  // 状態管理
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [selectedSuUser, setSelectedSuUser] = useState<UserInfo | null>(null);

  const fetchAllData = async (server: ServerInfo) => {
    try {
      // Configを取得
      const config = await invoke<Config>("get_config");

      // APIからユーザーデータを取得
      const response = await fetch(
        `${config.user_data_api}${server.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);

      const userData: UserInfo[] = await response.json();

      // 条件に応じて selectedUser と selectedSuUser を設定
      const user = userData.find(
        (user) => user.id === config.default_login_user
      );
      const suUser = userData.find(
        (user) => user.id === config.default_login_su
      );

      setSelectedUser(user || null);
      setSelectedSuUser(suUser || null);

      console.log("取得したユーザーデータ:", userData);
    } catch (error) {
      console.error("API呼び出しエラー:", error);
    }
  };

  useEffect(() => {
    if (selectedServer) {
      fetchAllData(selectedServer); // サーバ選択時に一連の処理を実行
    }
  }, [selectedServer]);

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
                <Table.Cell>{selectedServer?.sid}</Table.Cell>
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
