import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Table,
  Spinner,
  defineStyle,
  Field,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import {
  CiDesktop,
  CiEraser,
  CiLock,
  CiSearch,
  CiServer,
  CiViewList,
} from "react-icons/ci";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router";
import type { Config, ServerInfo, UserInfo } from "../../types";
import { listen } from "@tauri-apps/api/event";
import { Toaster, toaster } from "../ui/toaster";

const Home: React.FC = () => {
  const { Sid, setSid, setSelectedServer } = useAppContext();
  const [config, setConfig] = React.useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  // 状態管理
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const filterInputRef = React.useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const [filterValue, setFilterValue] = useState<string>("");

  // Modify the filtering logic
  const displayedServers = filteredServers.filter((server) => {
    if (!filterValue) return true;

    const columnValue = server["hostname"]?.toString().toLowerCase() || "";
    return columnValue.includes(filterValue.toLowerCase());
  });

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
    setSid("");
    setSelectedServer(null);
  }, []);

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

    // コンポーネントがアンマウントされたときにリスナーを解除
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // サーバ情報とユーザ情報のモックデータ

  // API呼び出し関数
  const fetchServerData = async () => {
    setLoading(true); // ローディング開始
    try {
      // APIリクエストを送信
      const response = await fetch(`${config?.server_data_api}?sid=${Sid}`, {
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
    } finally {
      setLoading(false); // ローディング終了
    }
    if (filterInputRef.current) {
      filterInputRef.current.focus();
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
        `${config?.user_data_api}?hostname=${server.hostname}`,
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
        `${config?.user_data_api}?hostname=${server?.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const users: UserInfo[] = await response.json();

      const defaultUser = users.find(
        (user) => user.username === config?.default_login_user
      );

      if (!defaultUser) {
        console.log(response);
        throw new Error("デフォルトユーザが見つかりません");
      }

      await invoke("teraterm_login", {
        ip: server?.ip,
        password: defaultUser.password,
        username: defaultUser.username,
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
        `${config?.user_data_api}?hostname=${server?.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const users: UserInfo[] = await response.json();

      const defaultUser = users.find(
        (user) => user.username === config?.default_login_user
      );

      if (!defaultUser) {
        console.log(response);
        throw new Error("デフォルトユーザが見つかりません");
      }
      // SUユーザーを検索
      const suUser = users.find(
        (user) => user.username === config?.default_login_su
      );
      if (!suUser) {
        throw new Error("SUユーザが見つかりません");
      }

      await invoke("teraterm_login_su", {
        ip: server?.ip,
        password: defaultUser.password,
        username: defaultUser.username,
        suUsername: suUser.username, // suユーザ名
        suPassword: suUser.password, // suユーザのパスワード
      });
    } catch (error) {
      console.error("ログインエラー:", error);
      alert("ログイン失敗" + error);
    }
  };

  // ログインボタン押下時の処理
  const handleLoginWin = async (server: ServerInfo) => {
    try {
      const response = await fetch(
        `${config?.user_data_api}?hostname=${server?.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const users: UserInfo[] = await response.json();

      const defaultUser = users.find(
        (user) => user.username === config?.default_login_win
      );

      if (!defaultUser) {
        console.log(response);
        throw new Error("デフォルトユーザが見つかりません");
      }

      await invoke("rdp_login", {
        ip: server?.ip,
        password: defaultUser.password,
        username: defaultUser.username,
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
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      <Box p={5}>
        <Toaster />
        <Stack>
          {/* SID入力 */}
          <Field.Root>
            <Box pos="relative" w="full">
              <Input
                className="peer"
                value={Sid}
                placeholder=""
                onChange={(e) => setSid(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={inputRef}
              />
              <Field.Label css={floatingStyles}>SID</Field.Label>
              <Field.HelperText>
                SIDは大文字で入力してください。
              </Field.HelperText>
            </Box>
          </Field.Root>
          <Button colorPalette="teal" onClick={fetchServerData}>
            <CiSearch />
            Search SID
          </Button>
          <Button onClick={handleClear}>
            <CiEraser />
            CLEAR
          </Button>

          <Field.Root marginTop={4}>
            <Box pos="relative" w="full">
              <Input
                className="peer"
                value={filterValue}
                placeholder=""
                ref={filterInputRef}
                onChange={(e) => setFilterValue(e.target.value)}
              />
              <Field.Label css={floatingStyles}>HostnameFilter</Field.Label>
              <Field.HelperText>
                フィルタリングするホスト名を入力してください。
              </Field.HelperText>
            </Box>
          </Field.Root>
          {loading ? (
            <Box mt={5}>
              <Spinner size="xl" color="teal.500" />
              <Text mt={2}>データを取得中...</Text>
            </Box>
          ) : (
            displayedServers.length > 0 && (
              <>
                <Table.Root size="md">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Hostname</Table.ColumnHeader>
                      <Table.ColumnHeader>IP Address</Table.ColumnHeader>
                      <Table.ColumnHeader>Action</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {displayedServers.map((server) => (
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
                              colorPalette="red"
                              onClick={() => handleLoginWin(server)}
                            >
                              <CiDesktop />
                              WinLogin
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
            )
          )}
        </Stack>
      </Box>
    </motion.div>
  );
};

const floatingStyles = defineStyle({
  pos: "absolute",
  bg: "bg",
  px: "0.5",
  top: "-3",
  insetStart: "2",
  fontWeight: "normal",
  pointerEvents: "none",
  transition: "position",
  _peerPlaceholderShown: {
    color: "fg.muted",
    top: "2.5",
    insetStart: "3",
  },
  _peerFocusVisible: {
    color: "fg",
    top: "-3",
    insetStart: "2",
  },
});

export default Home;
