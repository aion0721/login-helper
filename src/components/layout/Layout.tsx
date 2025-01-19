import { Box, Flex } from "@chakra-ui/react";
import Header from "./Header";
import Footer from "./Footer";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Box flex="1" as="main" p={4}>
        {children}
      </Box>
      <Footer />
    </Flex>
  );
};

export default Layout;
