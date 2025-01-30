import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Table,
  createListCollection,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import { CiDesktop, CiLock, CiServer } from "react-icons/ci";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import type { Config, ServerInfo, UserInfo } from "../../types";
import { listen } from "@tauri-apps/api/event";
import { Toaster, toaster } from "../ui/toaster";

import UserDropdown from "../ui/UserDropdown";

const Server: React.FC = () => {
  const { selectedServer } = useAppContext();

  // サーバ情報とユーザ情報のモックデータ

  // 状態管理
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [selectedSuUser, setSelectedSuUser] = useState<UserInfo | null>(null);
  const [selectedWinUser, setSelectedWinUser] = useState<UserInfo | null>(null);
  const [fetchUser, setFetchUser] = useState<UserInfo[] | null>([]);
  // 型を明示的に指定
  const [userCollection, setUserCollection] = useState<
    ReturnType<
      typeof createListCollection<{
        label: string;
        value: string;
        userInfo: UserInfo;
      }>
    >
  >(
    createListCollection({
      items: [],
    })
  );

  const fetchAllData = async (server: ServerInfo) => {
    try {
      // Configを取得
      const config = await invoke<Config>("get_config");

      // APIからユーザーデータを取得
      const response = await fetch(
        `${config.user_data_api}?hostname=${server.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);

      const userData: UserInfo[] = await response.json();

      // 条件に応じて selectedUser と selectedSuUser を設定
      const user = userData.find(
        (user) => user.username === config.default_login_user
      );
      const suUser = userData.find(
        (user) => user.username === config.default_login_su
      );
      const winUser = userData.find(
        (user) => user.username === config.default_login_win
      );

      setSelectedUser(user || null);
      setSelectedSuUser(suUser || null);
      setSelectedWinUser(winUser || null);
      setFetchUser(userData);

      // ユーザーデータをリスト形式に変換
      const transformedItems = userData.map((user) => ({
        label: user.username,
        value: user.username,
        userInfo: user,
      }));

      // createListCollectionを使用してコレクションを作成
      const collection = createListCollection({ items: transformedItems });
      setUserCollection(collection);

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

  useEffect(() => {
    // Rustからのイベントをリッスン
    const unlisten = listen("rust_event", (event) => {
      const message = event.payload as string;
      toaster.create({
        description: message,
        type: "success", // トーストの種類（success, error, info, warning）
        duration: 5000, // 表示時間（ミリ秒）
      });
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  });

  // ログインボタン押下時の処理
  const handleLogin = async (user: UserInfo) => {
    try {
      await invoke("teraterm", {
        ip: selectedServer?.ip,
        password: user.password,
        username: user.username,
        isSu: false,
      });
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン失敗" + error);
    }
  };

  // ログインボタン押下時の処理
  const handleLoginSu = async (user: UserInfo, suUser: UserInfo) => {
    try {
      await invoke("teraterm", {
        ip: selectedServer?.ip,
        password: user.password,
        username: user.username,
        suUsername: suUser.username, // suユーザ名
        suPassword: suUser.password, // suユーザのパスワード
        isSu: true,
      });
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン失敗" + error);
    }
  };

  // ログインボタン押下時の処理
  const handleWinLogin = async (user: UserInfo) => {
    try {
      await invoke("rdp_login", {
        ip: selectedServer?.ip,
        password: user.password,
        username: user.username,
      });
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン失敗" + error);
    }
  };
  // 汎用的なユーザー変更ハンドラー
  const handleUserChange = (
    value: unknown,
    setUserState: (user: UserInfo | null) => void
  ) => {
    // 型アサーションで型をキャスト
    const { value: selectedValue } = value as {
      label: string;
      value: string;
      userInfo: UserInfo;
    };

    // 選択されたユーザーを検索して状態を更新
    const selectedUser = fetchUser?.find(
      (user) => user.username === selectedValue[0]
    );
    setUserState(selectedUser || null);
  };

  // 各ユーザー変更ハンドラー
  const handleLoginUserChange = (value: unknown) =>
    handleUserChange(value, setSelectedUser);

  const handleSuUserChange = (value: unknown) =>
    handleUserChange(value, setSelectedSuUser);

  const handleWinUserChange = (value: unknown) =>
    handleUserChange(value, setSelectedWinUser);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }} // 初期状態: 右からスライドイン
      animate={{ opacity: 1, x: 0 }} // アニメーション後: 表示位置
      exit={{ opacity: 0, x: -100 }} // ページ離脱時: 左へスライドアウト
      transition={{ duration: 0.5 }} // アニメーション速度
    >
      <Toaster />
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
                  <UserDropdown
                    label="Select User"
                    userCollection={userCollection}
                    selectedUser={selectedUser}
                    onChange={handleLoginUserChange}
                  />
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>SuUsers</Table.Cell>
                <Table.Cell>
                  <UserDropdown
                    label="Select Su User"
                    userCollection={userCollection}
                    selectedUser={selectedSuUser}
                    onChange={handleSuUserChange}
                  />
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>WinUser</Table.Cell>
                <Table.Cell>
                  <UserDropdown
                    label="Select Win User"
                    userCollection={userCollection}
                    selectedUser={selectedWinUser}
                    onChange={handleWinUserChange}
                  />
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>

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

          {/* ユーザ情報 */}
          {selectedWinUser && (
            <>
              <Button
                colorPalette="teal"
                onClick={() => handleWinLogin(selectedWinUser)}
              >
                <CiDesktop />
                Win Login
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </motion.div>
  );
};

export default Server;
