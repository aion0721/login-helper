import { useState, useEffect } from "react";
import { IconButton, Box } from "@chakra-ui/react";
import { CiCircleChevUp } from "react-icons/ci";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // スクロールイベントのハンドラー
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // ページトップに戻る関数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    // スクロールイベントを監視
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <Box position="fixed" bottom="20px" right="20px" zIndex="1000">
      {isVisible && (
        <IconButton
          aria-label="Scroll to top"
          onClick={scrollToTop}
          size="lg"
          borderRadius="full"
          bg="gray.600"
          color="white"
          _hover={{ bg: "gray.500" }}
        >
          <CiCircleChevUp />
        </IconButton>
      )}
    </Box>
  );
};

export default ScrollToTopButton;
