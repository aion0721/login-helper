import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";

interface Config {
  ttpmacro_path: string;
  server_data_api: string;
  user_data_api: string;
}

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
      <div>
        <h1>Config</h1>
        <p> ttpmacro_path:{config?.ttpmacro_path}</p>
        <p> server_data_api:{config?.server_data_api}</p>
        <p> user_data_api:{config?.user_data_api}</p>
      </div>
    </motion.div>
  );
};

export default Config;
