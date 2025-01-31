import { Flex, Image, Text } from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { CiDatabase, CiHome, CiSettings } from "react-icons/ci";
import { Link as ReactRouterLink } from "react-router-dom";
import logo from "../../assets/logo.webp";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ColorModeButton } from "../ui/color-mode";

const Header: React.FC = () => {
  const [loginUser, setLoginUser] = useState<string>("");
  useEffect(() => {
    invoke<string>("get_user")
      .then((result) => {
        setLoginUser(result);
      })
      .catch((err) => {
        console.error("API呼び出しエラー:", err);
      });
  }, []);
  return (
    <Flex as="header" bg="teal.500" color="white" p={4} align="center" gap="4">
      {/* ロゴ部分 */}
      <Flex align="center" gap={2}>
        <Image src={logo} alt="Logo" boxSize="40px" />
        <Text fontWeight="bold">Login Helper</Text>
      </Flex>

      {/* Spacerで左右の要素を分ける */}
      <Flex flex="1" justify="flex-end" gap="4">
        <Text>Welcome, {loginUser}!</Text>
        <ChakraLink asChild>
          <ReactRouterLink to="/">
            <CiHome />
            Home
          </ReactRouterLink>
        </ChakraLink>
        <ChakraLink asChild>
          <ReactRouterLink to="/data">
            <CiDatabase />
            Data
          </ReactRouterLink>
        </ChakraLink>
        <ChakraLink asChild>
          <ReactRouterLink to="/config">
            <CiSettings />
            Config
          </ReactRouterLink>
        </ChakraLink>
      </Flex>
      <ColorModeButton />
    </Flex>
  );
};

export default Header;
