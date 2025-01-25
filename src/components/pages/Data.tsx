import { Box, Button, Heading, Input, VStack } from "@chakra-ui/react";
import { Field } from "../ui/field";

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
      <Box maxW="md" mx="auto" mt={10}>
        <VStack>
          {/* SID フィールド */}
          <Field label="sid">
            <Input id="sid" placeholder="Enter SID" />
          </Field>

          <Field label="hostname">
            <Input id="hostname" placeContent="Enter Hostname" />
          </Field>

          {/* ID フィールド */}
          <Field label="id">
            <Input id="id" placeholder="Enter ID" />
          </Field>

          {/* Password フィールド */}
          <Field label="password">
            <Input id="password" placeholder="Enter Password" />
          </Field>

          {/* Submit ボタン */}
          <Button mt={4} colorScheme="teal" type="submit">
            Submit
          </Button>
        </VStack>
      </Box>
    </motion.div>
  );
};

export default Data;
