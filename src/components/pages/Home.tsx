import React, { Suspense, useEffect, useState } from "react";
import {
  Box,
  Button,
  Input,
  Stack,
  Text,
  Spinner,
  defineStyle,
  Field,
  Flex,
  Group,
  parseColor,
  Kbd,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import { CiEraser, CiSearch } from "react-icons/ci";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import type { Config, ServerInfo } from "../../types";
import { listen } from "@tauri-apps/api/event";
import { Toaster, toaster } from "../ui/toaster";
import { Checkbox } from "../ui/checkbox";
import {
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerEyeDropper,
  ColorPickerInput,
  ColorPickerLabel,
  ColorPickerRoot,
  ColorPickerSliders,
  ColorPickerSwatchGroup,
  ColorPickerSwatchTrigger,
  ColorPickerTrigger,
} from "../ui/color-picker";

const LazyServerTable = React.lazy(() => import("../parts/ServerTable"));

const Home: React.FC = () => {
  const { Sid, setSid, setSelectedServer } = useAppContext();
  const [config, setConfig] = React.useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocChecked, setOcChecked] = useState(false);
  const [terminalBg, setTerminalBg] = useState(parseColor("#000000"));
  // 状態管理
  const [filteredServers, setFilteredServers] = useState<ServerInfo[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const filterInputRef = React.useRef<HTMLInputElement>(null);

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
      <Box p={2}>
        <Toaster />
        <Stack>
          <Text fontSize="sm" color="gray">
            ウィンドウを閉じると常駐します。<Kbd>Ctrl</Kbd>+<Kbd>Alt</Kbd>+
            <Kbd>E</Kbd>
            でウィンドウを開きます。終了するにはタスクトレイを右クリックで「終了」
          </Text>
          <Flex gap="4">
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
          </Flex>

          <Group direction="row">
            <Text>Options</Text>
            <Checkbox
              checked={ocChecked}
              onCheckedChange={(e) => setOcChecked(!!e.checked)}
            >
              OC Login
            </Checkbox>
            <ColorPickerRoot
              size="xs"
              value={terminalBg}
              onValueChange={(e) => setTerminalBg(e.value)}
            >
              <ColorPickerLabel>背景色</ColorPickerLabel>
              <ColorPickerControl>
                <ColorPickerInput />
                <ColorPickerTrigger />
              </ColorPickerControl>
              <ColorPickerContent>
                <ColorPickerEyeDropper />
                <ColorPickerSliders />
                <ColorPickerSwatchGroup>
                  {[
                    "red",
                    "blue",
                    "green",
                    "#ADD8E6",
                    "#FAEBD7",
                    "#F5F5F5",
                    "#F0F8FF",
                  ].map((item) => (
                    <ColorPickerSwatchTrigger
                      swatchSize="4.5"
                      key={item}
                      value={item}
                    />
                  ))}
                </ColorPickerSwatchGroup>
              </ColorPickerContent>
            </ColorPickerRoot>
          </Group>
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
              <Suspense
                fallback={
                  <Box mt={5}>
                    <Spinner size="xl" color="teal.500" />
                    <Text mt={2}>コンテンツをロード中...</Text>
                  </Box>
                }
              >
                <LazyServerTable
                  displayedServers={displayedServers}
                  config={config}
                  ocChecked={ocChecked}
                  terminalBg={terminalBg}
                />
              </Suspense>
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
