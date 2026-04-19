import React from "react";
import { Flex, Spinner, Text } from "@chakra-ui/react";

const Loading = () => {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap={4}
      py={12}
    >
      <Spinner
        thickness="3px"
        speed="0.8s"
        emptyColor="gray.100"
        color="teal.500"
        size="lg"
      />
      <Text color="gray.400" fontSize="sm">
        Loading...
      </Text>
    </Flex>
  );
};

export default Loading;