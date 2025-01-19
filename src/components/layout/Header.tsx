import { Box, Flex } from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { Link as ReactRouterLink } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <Flex as="header" bg="teal.500" color="white" p={4} justify="space-between">
      <Box fontWeight="bold">My App</Box>
      <Flex gap={4}>
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
