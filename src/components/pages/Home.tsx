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
  CiUser,
} from "react-icons/ci";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router";
import type { Config, ServerInfo, UserInfo } from "../../types";
import { listen } from "@tauri-apps/api/event";
import { Toaster, toaster } from "../ui/toaster";
import { Tooltip } from "../ui/tooltip";

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

  type LoginType = "default" | "su" | "win";

  const handleLoginGeneric = async (
    server: ServerInfo,
    loginType: LoginType
  ) => {
    try {
      const response = await fetch(
        `${config?.user_data_api}?hostname=${server?.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const users: UserInfo[] = await response.json();

      let defaultUser: UserInfo | undefined;
      let suUser: UserInfo | undefined;

      // デフォルトユーザーの取得
      switch (loginType) {
        case "default":
          defaultUser = users.find(
            (user) => user.username === config?.default_login_user
          );
          break;
        case "su":
          defaultUser = users.find(
            (user) => user.username === config?.default_login_user
          );
          suUser = users.find(
            (user) => user.username === config?.default_login_su
          );
          break;
        case "win":
          defaultUser = users.find(
            (user) => user.username === config?.default_login_win
          );
          break;
        default:
          throw new Error("無効なログインタイプです");
      }

      if (!defaultUser) {
        throw new Error("デフォルトユーザが見つかりません");
      }

      if (loginType === "su" && !suUser) {
        throw new Error("SUユーザが見つかりません");
      }

      // invoke の呼び出し
      if (loginType === "win") {
        await invoke("rdp_login", {
          ip: server?.ip,
          password: defaultUser.password,
          username: defaultUser.username,
        });
      } else {
        await invoke("teraterm", {
          ip: server?.ip,
          password: defaultUser.password,
          username: defaultUser.username,
          ...(loginType === "su" && suUser
            ? {
                suUsername: suUser.username,
                suPassword: suUser.password,
                isSu: true,
              }
            : {}),
        });
      }
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
                            <Tooltip
                              showArrow
                              content={`User:${config?.default_login_user}`}
                            >
                              <Button
                                colorPalette="cyan"
                                onClick={() =>
                                  handleLoginGeneric(server, "default")
                                }
                              >
                                <CiServer />
                                Login
                              </Button>
                            </Tooltip>
                            <Tooltip
                              showArrow
                              content={`SuUser:${config?.default_login_su}`}
                            >
                              <Button
                                colorPalette="teal"
                                onClick={() => handleLoginGeneric(server, "su")}
                              >
                                <CiLock />
                                SuLogin
                              </Button>
                            </Tooltip>
                            <Tooltip
                              showArrow
                              content={`WinUser:${config?.default_login_win}`}
                            >
                              <Button
                                colorPalette="red"
                                onClick={() =>
                                  handleLoginGeneric(server, "win")
                                }
                              >
                                <CiDesktop />
                                WinLogin
                              </Button>
                            </Tooltip>
                            <Tooltip
                              showArrow
                              content="SwitchUser/ShowPassword"
                            >
                              <Button
                                colorPalette="yellow"
                                onClick={() => handleServerSelect(server)}
                              >
                                <CiUser />
                                SelectUser
                              </Button>
                            </Tooltip>
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
