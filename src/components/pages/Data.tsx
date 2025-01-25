import React from "react";
import { Box, Button, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { Field } from "../ui/field";
import { motion } from "framer-motion";
import type { UserInfo, Config } from "../../types";
import { invoke } from "@tauri-apps/api/core";

const Data = () => {
  const [targetUser, setTargetUser] = React.useState<UserInfo>({} as UserInfo);
  const [fetchData, setFetchData] = React.useState<UserInfo | null>(null);

  const getUserData = async () => {
    try {
      const config = await invoke<Config>("get_config");
      const response = await fetch(
        `${config.user_data_api}?id=${targetUser.sid}_${targetUser.hostname}_${targetUser.username}`,
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      <Heading>Data</Heading>
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
                  value={fetchData?.password || ""} // targetUser の sid プロパティをバインド
                  onChange={(e) =>
                    setTargetUser((prev) => ({
                      ...prev, // 既存のプロパティを維持
                      password: e.target.value, // sid を更新
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
                {!fetchData.id ? "Create" : "Update"} User Data
              </Button>
            </>
          )}
        </VStack>
      </Box>
    </motion.div>
  );
};

export default Data;
