import React, {
    useState,
    useEffect,
} from "react";
import { useNavigate } from 'react-router-dom';
import {
  Flex,
  Stack,
  Heading,
  Box,
  Avatar,
  Text,
  Separator,
  IconButton,
  Spacer,
} from "@chakra-ui/react";
import ProfileFolders from "./ProfileFolders";
import { LuLogOut } from "react-icons/lu";
import Loading from './Loading'

const Profile = () => {

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(null);

    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            setLoading(true);

            const response = await fetch('http://localhost:8000/logout', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`HTTP Error! Failed to logout: status ${response.status}}`);
            }

            navigate('/auth');

        } catch(err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Flex
        height="100vh"
        width="100%"
        flexDirection="column"
        bgGradient="linear(to-br, gray.50, gray.100)"
        justifyContent="center"
        alignItems="center"
        p={4}
        >
        <Stack
            flexDir="column"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
            maxW="1200px"
        >
            <Box 
            minW={{ base: "90%", md: "500px" }} 
            minH={{ base: "auto", md: "85%" }}
            >
            <Stack
                spacing={6}
                p={6}
                bg="white"
                boxShadow="xl"
                borderRadius="2xl"
                h="100%"
                w="100%"
                transition="all 0.3s"
                _hover={{ boxShadow: "2xl" }}
                end
            >
                {/* Profile Header */}
                <Flex align="center" gap={4}>

                    <Avatar.Root size="lg" variant="solid" colorPalette="teal">
                        <Avatar.Fallback name="Yalmen" />
                    </Avatar.Root>

                    <Box>
                        <Heading size="md" color="teal.500">
                        Welcome back!
                        </Heading>
                        <Text fontSize="sm" color="gray.500">
                        Manage your files and folders
                        </Text>
                    </Box>

                </Flex>
                
                {/* Logical Separator between Profile and Filesystem */}
                <Separator />
                
                {/* Folders Component */}
                <ProfileFolders />

                <Spacer />
                <Separator />
                
                {/* Logout Button Footer */}
                <IconButton
                    size="sm"
                    variant="ghost"
                    colorScheme="black"
                    aria-label="Logout"
                    onClick={handleLogout}
                >
                    <LuLogOut />
                </IconButton>
            </Stack>
            </Box>
        </Stack>
        </Flex>
    );
};

export default Profile;