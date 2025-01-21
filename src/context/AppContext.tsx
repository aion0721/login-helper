import { createContext, useContext, useState } from "react";

interface ServerInfo {
  sid: string;
  ip: string;
  hostname: string;
}

// コンテキストの型定義
interface AppContextType {
  Sid: string;
  setSid: (value: string) => void;
  selectedServer: ServerInfo | null; // nullを許容
  setSelectedServer: (value: ServerInfo | null) => void; // nullを設定可能
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [Sid, setSid] = useState("");
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);

  return (
    <AppContext.Provider
      value={{ Sid, setSid, selectedServer, setSelectedServer }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppProvider");
  }
  return context;
};
