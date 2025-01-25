import { Heading } from "@chakra-ui/react";
import { motion } from "framer-motion";
const Data = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      <Heading>Data</Heading>
    </motion.div>
  );
};

export default Data;
