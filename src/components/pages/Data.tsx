import React from "react";
import { Box, Button, Heading, Input, Tabs, VStack } from "@chakra-ui/react";
import { Field } from "../ui/field";
import { motion } from "framer-motion";
import type { UserInfo, Config, ServerInfo } from "../../types";
import { invoke } from "@tauri-apps/api/core";
import { toaster, Toaster } from "../ui/toaster";
import { CiServer, CiUser } from "react-icons/ci";

const Data = () => {
  const [targetUser, setTargetUser] = React.useState<UserInfo>({} as UserInfo);
  const [targetServer, setTargetServer] = React.useState<ServerInfo>(
    {} as ServerInfo
  );
  const [fetchUserData, setFetchUserData] = React.useState<UserInfo | null>(
    null
  );
  const [fetchServerData, setFetchServerData] = React.useState<ServerInfo>(
    {} as ServerInfo
  );

  const getServerData = async () => {
    try {
      const config = await invoke<Config>("get_config");
      const response = await fetch(
        `${config.server_data_api}?hostname=${targetServer.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const serverData: ServerInfo[] = await response.json(); // 配列として受け取る
        console.log(serverData);

        // 配列の最初の要素だけをセット
        if (serverData.length > 0) {
          setFetchServerData(serverData[0]);
        } else {
          setFetchServerData({} as ServerInfo);
        }
      } else {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
    } catch (error) {
      console.error("データ取得中にエラーが発生しました:", error);
      setTargetServer({} as ServerInfo); // エラー時には null をセット
    }
  };

  const getUserData = async () => {
    try {
      const config = await invoke<Config>("get_config");
      const response = await fetch(
        `${config.user_data_api}?id=${targetUser.sid}_${targetUser.username}_${targetUser.hostname}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const userData: UserInfo[] = await response.json(); // 配列として受け取る
        console.log(userData);

        // 配列の最初の要素だけをセット
        if (userData.length > 0) {
          setFetchUserData(userData[0]);
        } else {
          setFetchUserData({} as UserInfo);
        }
      } else {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
    } catch (error) {
      console.error("データ取得中にエラーが発生しました:", error);
      setTargetUser({} as UserInfo); // エラー時には null をセット
    }
  };

  const pushServerData = async () => {
    try {
      const config = await invoke<Config>("get_config");
      const ApiEndpoint = `${config.server_data_api}?hostname=${fetchServerData.hostname}`;

      const response = await fetch(ApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fetchServerData,
          hostname: `${targetServer.hostname}`,
        }), // 送信するデータをセット
      });

      if (response.ok) {
        toaster.create({
          description: "データが追加・更新されました。",
          type: "success", // トーストの種類（success, error, info, warning）
          duration: 5000, // 表示時間（ミリ秒）
        });
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      toaster.create({
        type: "error",
        description: errorMessage,
      });
    }
  };

  const pushUserData = async () => {
    try {
      const config = await invoke<Config>("get_config");
      // fetchDataのidがある場合＝既存のユーザがある。そのため、更新処理となる。
      // fetchDataのidがない場合＝既存のユーザがない。そのため、追加処理となる。
      const ApiEndpoint = fetchUserData?.id
        ? `${config.user_data_api}?id=${fetchUserData.id}`
        : `${config.user_data_api}`;

      const response = await fetch(ApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fetchUserData,
          id: `${targetUser.sid}_${targetUser.username}_${targetUser.hostname}`,
        }), // 送信するデータをセット
      });

      if (response.ok) {
        toaster.create({
          description: "データが追加・更新されました。",
          type: "success", // トーストの種類（success, error, info, warning）
          duration: 5000, // 表示時間（ミリ秒）
        });
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      toaster.create({
        type: "error",
        description: errorMessage,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      <Toaster />
      <Tabs.Root defaultValue="server" justify="center">
        <Tabs.List>
          <Tabs.Trigger value="server">
            <CiServer />
            Server
          </Tabs.Trigger>
          <Tabs.Trigger value="user">
            <CiUser />
            User
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="server">
          <Box maxW="md" mx="auto" mt={10}>
            <Heading>Server</Heading>
            {/* Hostname フィールド */}
            <VStack>
              <Field label="hostname">
                <Input
                  id="hostname"
                  value={targetServer.hostname || ""} // targetUser の sid プロパティをバインド
                  onChange={(e) =>
                    setTargetServer((prev) => ({
                      ...prev, // 既存のプロパティを維持
                      hostname: e.target.value, // hostname を更新
                    }))
                  }
                />
              </Field>
              {/* Submit ボタン */}
              <Button
                w={"100%"}
                colorPalette="teal"
                onClick={() => {
                  getServerData();
                }}
              >
                Search Server
              </Button>
              {fetchServerData && (
                <>
                  <Field label="sid">
                    <Input
                      id="sid"
                      value={fetchServerData?.sid || ""} // fetchData.password が未定義の場合は空文字列
                      onChange={(e) =>
                        setFetchServerData((prev) => ({
                          ...targetServer,
                          ...prev, // prev は常にオブジェクトとして扱える
                          sid: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="ip">
                    <Input
                      id="ip"
                      value={fetchServerData?.ip || ""} // fetchData.password が未定義の場合は空文字列
                      onChange={(e) =>
                        setFetchServerData((prev) => ({
                          ...targetServer,
                          ...prev, // prev は常にオブジェクトとして扱える
                          ip: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="memo">
                    <Input
                      id="memo"
                      value={fetchServerData?.memo || ""} // fetchData.password が未定義の場合は空文字列
                      onChange={(e) =>
                        setFetchServerData((prev) => ({
                          ...targetServer,
                          ...prev, // prev は常にオブジェクトとして扱える
                          memo: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  {/* Submit ボタン */}

                  <Button
                    w={"100%"}
                    colorPalette="teal"
                    onClick={() => {
                      pushServerData();
                    }}
                    disabled={
                      !fetchServerData.sid ||
                      !fetchServerData.ip ||
                      !fetchServerData.memo
                    }
                  >
                    {!fetchServerData.sid ? "Create" : "Update"} User Data
                  </Button>
                </>
              )}
            </VStack>
          </Box>
        </Tabs.Content>
        <Tabs.Content value="user">
          <Box maxW="md" mx="auto" mt={10}>
            <Heading>User</Heading>
            <VStack>
              {/* SID フィールド */}
              <Field label="sid">
                <Input
                  id="sid"
                  value={targetUser.sid || ""} // targetUser の sid プロパティをバインド
                  onChange={(e) =>
                    setTargetUser((prev) => ({
                      ...prev, // 既存のプロパティを維持
                      sid: e.target.value, // sid を更新
                    }))
                  }
                />
              </Field>

              {/* Hostname フィールド */}
              <Field label="hostname">
                <Input
                  id="hostname"
                  value={targetUser.hostname || ""} // targetUser の sid プロパティをバインド
                  onChange={(e) =>
                    setTargetUser((prev) => ({
                      ...prev, // 既存のプロパティを維持
                      hostname: e.target.value, // sid を更新
                    }))
                  }
                />
              </Field>

              {/* username フィールド */}
              <Field label="username">
                <Input
                  id="username"
                  value={targetUser.username || ""} // targetUser の sid プロパティをバインド
                  onChange={(e) =>
                    setTargetUser((prev) => ({
                      ...prev, // 既存のプロパティを維持
                      username: e.target.value, // sid を更新
                    }))
                  }
                />
              </Field>

              {/* Submit ボタン */}
              <Button
                w={"100%"}
                colorPalette="teal"
                onClick={() => {
                  getUserData();
                }}
              >
                Search User
              </Button>

              {fetchUserData && (
                <>
                  <Field label="password">
                    <Input
                      id="password"
                      value={fetchUserData?.password || ""} // fetchData.password が未定義の場合は空文字列
                      onChange={(e) =>
                        setFetchUserData((prev) => ({
                          ...targetUser,
                          ...prev, // prev は常にオブジェクトとして扱える
                          password: e.target.value,
                        }))
                      }
                    />
                  </Field>

                  {/* Submit ボタン */}

                  <Button
                    w={"100%"}
                    colorPalette="teal"
                    onClick={() => {
                      pushUserData();
                    }}
                    disabled={!fetchUserData.password}
                  >
                    {!fetchUserData.id ? "Create" : "Update"} User Data
                  </Button>
                </>
              )}
            </VStack>
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </motion.div>
  );
};

export default Data;
