import React from "react";
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueText,
  createListCollection,
} from "@chakra-ui/react";
import type { UserInfo } from "../../types";

type UserDropdownProps = {
  label: string;
  userCollection: ReturnType<
    typeof createListCollection<{
      label: string;
      value: string;
      userInfo: UserInfo;
    }>
  >;
  selectedUser: UserInfo | null;
  onChange: (value: unknown) => void;
};

const UserDropdown: React.FC<UserDropdownProps> = ({
  label,
  userCollection,
  selectedUser,
  onChange,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* ラベル */}
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{label}</div>

      {/* 選択されたユーザー情報 */}
      {selectedUser && (
        <div style={{ fontSize: "14px", color: "#555" }}>
          <span>
            <strong>ID:</strong> {selectedUser.username}
          </span>{" "}
          /{" "}
          <span>
            <strong>Password:</strong> {selectedUser.password}
          </span>
        </div>
      )}

      {/* ドロップダウン */}
      <SelectRoot collection={userCollection} onValueChange={onChange}>
        <SelectTrigger
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <SelectValueText placeholder="Select user" />
        </SelectTrigger>
        <SelectContent style={{ maxHeight: "200px", overflowY: "auto" }}>
          {userCollection.items.map((user) => (
            <SelectItem key={user.userInfo.id} item={user}>
              {user.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </div>
  );
};

export default UserDropdown;
