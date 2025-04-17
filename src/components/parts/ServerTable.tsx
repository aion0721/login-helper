import { useNavigate } from "react-router";
import { useAppContext } from "../../context/AppContext";
import { Config, ServerInfo, UserInfo } from "../../types";
import { Button, Color, Stack, Table } from "@chakra-ui/react";
import { ClipboardIconButton, ClipboardRoot } from "../ui/clipboard";
import { Tooltip } from "../ui/tooltip";
import { CiDesktop, CiLock, CiServer, CiUser } from "react-icons/ci";
import { invoke } from "@tauri-apps/api/core";

interface ServerTableProps {
  displayedServers: ServerInfo[];
  config: Config | null;
  ocChecked: boolean;
  terminalBg: Color;
}

const ServerTable: React.FC<ServerTableProps> = ({
  displayedServers,
  config,
  ocChecked,
  terminalBg,
}) => {
  const { Sid, setSelectedServer } = useAppContext();
  const navigate = useNavigate();

  const extractedSid = Sid.length === 6 ? Sid.substring(2, 5) : Sid;

  type LoginType = "default" | "su" | "win";

  const ocUser = config?.default_login_oc_user
    ? config.default_login_oc_user.replace(
        /\[sid\]/g,
        extractedSid.toLowerCase()
      )
    : null;

  const ocId = config?.default_login_oc_id
    ? config.default_login_oc_id.replace(/\[sid\]/g, extractedSid.toLowerCase())
    : null;

  const ocUrl = config?.default_login_oc_url ?? null;

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

      // APIからユーザーデータを取得
      const ocResponse = await fetch(`${config?.user_data_api}?id=${ocId}`, {
        method: "GET", // 必要に応じて GET に変更
        headers: {
          "Content-Type": "application/json",
        },
      });

      // 応答が正常か確認
      if (!ocResponse.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }

      // JSONデータをパース
      const ocData = await ocResponse.json();
      const ocPassword = ocData.length > 0 ? ocData[0].password ?? "" : "";

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

      if (ocChecked) {
        console.log(ocUser);
      }

      const bgColor = [
        terminalBg.toJSON().r,
        terminalBg.toJSON().g,
        terminalBg.toJSON().b,
      ].join(",");

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
          sid: server?.sid,
          hostname: server?.hostname,
          memo: server?.memo,
          password: defaultUser.password,
          username: defaultUser.username,
          isOc: ocChecked,
          ocUrl: ocUrl,
          ocUser: ocUser,
          ocPassword: ocPassword,
          bgColor,
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

  return (
    <Table.Root size="md" interactive stickyHeader showColumnBorder>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Hostname</Table.ColumnHeader>
          <Table.ColumnHeader>IP Address</Table.ColumnHeader>
          <Table.ColumnHeader>Memo</Table.ColumnHeader>
          <Table.ColumnHeader>Action</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {displayedServers.map((server) => (
          <Table.Row key={server.ip}>
            <Table.Cell>
              <ClipboardRoot value={server.hostname}>
                {server.hostname} <ClipboardIconButton />
              </ClipboardRoot>
            </Table.Cell>
            <Table.Cell>
              <ClipboardRoot value={server.ip}>
                {server.ip} <ClipboardIconButton />
              </ClipboardRoot>
            </Table.Cell>
            <Table.Cell>
              <ClipboardRoot value={server.memo}>
                {server.memo} <ClipboardIconButton />
              </ClipboardRoot>
            </Table.Cell>
            <Table.Cell>
              <Stack direction="row" justify="center">
                <Tooltip
                  showArrow
                  content={`User:${config?.default_login_user}`}
                >
                  <Button
                    colorPalette="cyan"
                    size="sm"
                    onClick={() => handleLoginGeneric(server, "default")}
                  >
                    <CiServer />
                    SSH
                  </Button>
                </Tooltip>
                <Tooltip
                  showArrow
                  content={`SuUser:${config?.default_login_su}`}
                >
                  <Button
                    colorPalette="teal"
                    size="sm"
                    onClick={() => handleLoginGeneric(server, "su")}
                  >
                    <CiLock />
                    SSH(su)
                  </Button>
                </Tooltip>
                <Tooltip
                  showArrow
                  content={`WinUser:${config?.default_login_win}`}
                >
                  <Button
                    colorPalette="red"
                    size="sm"
                    onClick={() => handleLoginGeneric(server, "win")}
                  >
                    <CiDesktop />
                    Win(RDP)
                  </Button>
                </Tooltip>
                <Tooltip showArrow content="SwitchUser/ShowPassword">
                  <Button
                    colorPalette="yellow"
                    size="sm"
                    onClick={() => handleServerSelect(server)}
                  >
                    <CiUser />
                    Detail
                  </Button>
                </Tooltip>
              </Stack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default ServerTable;
