import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { Heading, Table } from "@chakra-ui/react";
import type { Config } from "../../types";

const Config: React.FC = () => {
  const [config, setConfig] = React.useState<Config | null>(null);
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
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      <Heading>Config</Heading>
      <Table.Root size="md">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Config</Table.ColumnHeader>
            <Table.ColumnHeader>Value</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>ttpmacro_path</Table.Cell>
            <Table.Cell>{config?.ttpmacro_path}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>server_data_api</Table.Cell>
            <Table.Cell>{config?.server_data_api}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>user_data_api</Table.Cell>
            <Table.Cell>{config?.user_data_api}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>default_login_user</Table.Cell>
            <Table.Cell>{config?.default_login_user}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>default_login_su</Table.Cell>
            <Table.Cell>{config?.default_login_su}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </motion.div>
  );
};

export default Config;
