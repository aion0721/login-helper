import React from "react";
import { Box, Button, Input, Tabs, VStack } from "@chakra-ui/react";
import { Field } from "../ui/field";
import { motion } from "framer-motion";
import type { UserInfo, Config } from "../../types";
import { invoke } from "@tauri-apps/api/core";
import { toaster, Toaster } from "../ui/toaster";
import { CiServer, CiUser } from "react-icons/ci";

const Data = () => {
  const [targetUser, setTargetUser] = React.useState<UserInfo>({} as UserInfo);
  const [fetchData, setFetchData] = React.useState<UserInfo | null>(null);

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
          setFetchData(userData[0]);
        } else {
          setFetchData({} as UserInfo);
        }
      } else {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
    } catch (error) {
      console.error("データ取得中にエラーが発生しました:", error);
      setTargetUser({} as UserInfo); // エラー時には null をセット
    }
  };

  const pushUserData = async () => {
    try {
      const config = await invoke<Config>("get_config");
      // fetchDataのidがある場合＝既存のユーザがある。そのため、更新処理となる。
      // fetchDataのidがない場合＝既存のユーザがない。そのため、追加処理となる。
      const ApiEndpoint = fetchData?.id
        ? `${config.user_data_api}?id=${fetchData.id}`
        : `${config.user_data_api}`;

      const response = await fetch(ApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fetchData,
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
        <Tabs.Content value="server">Server</Tabs.Content>
        <Tabs.Content value="user">
          <Box maxW="md" mx="auto" mt={10}>
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

              {fetchData && (
                <>
                  <Field label="password">
                    <Input
                      id="password"
                      value={fetchData?.password || ""} // fetchData.password が未定義の場合は空文字列
                      onChange={(e) =>
                        setFetchData((prev) => ({
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
                    disabled={!fetchData.password}
                  >
                    {!fetchData.id ? "Create" : "Update"} User Data
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
