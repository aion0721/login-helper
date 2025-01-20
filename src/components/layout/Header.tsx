import { Flex, Image, Text } from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { Link as ReactRouterLink } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <Flex as="header" bg="teal.500" color="white" p={4} align="center">
      {/* ロゴ部分 */}
      <Flex align="center" gap={2}>
        <Image src="/logo.png" alt="Logo" boxSize="40px" />
        <Text fontWeight="bold">Login Helper</Text>
      </Flex>

      {/* Spacerで左右の要素を分ける */}
      <Flex flex="1" justify="flex-end" gap={4}>
        <ChakraLink asChild>
          <ReactRouterLink to="/">Home</ReactRouterLink>
        </ChakraLink>
        <ChakraLink asChild>
          <ReactRouterLink to="/config">Config</ReactRouterLink>
        </ChakraLink>
      </Flex>
    </Flex>
  );
};

export default Header;
