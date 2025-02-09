import { Box, Text } from "@chakra-ui/react";
import React from "react";

const Footer: React.FC = () => {
  return (
    <Box as="footer" bg="gray.700" color="white" p={2} textAlign="center">
      <Text>© 2025 Login Helper</Text>
    </Box>
  );
};

export default Footer;
