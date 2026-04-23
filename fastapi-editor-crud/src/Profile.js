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
  Button,
  VStack,
} from "@chakra-ui/react";
import ProfileFolders from "./ProfileFolders";
import { LuLogOut } from "react-icons/lu";
import Loading from './Loading'

const Profile = () => {

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const navigate = useNavigate();

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('http://localhost:8000/me', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username);
                    setIsAuthenticated(true);
                } else if (response.status === 401) {
                    navigate('/auth');
                } else {
                    throw new Error(`Failed to authenticate: ${response.status}`);
                }
            } catch (err) {
                console.error('Auth check error:', err);
                setError(err.message);
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            setLoading(true);

            const response = await fetch('http://localhost:8000/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to logout: status ${response.status}`);
            }

            navigate('/auth');

        } catch(err) {
            console.error('Logout error:', err);
            setError(err.message);
            navigate('/auth');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <Flex
                height="100vh"
                width="100%"
                justifyContent="center"
                alignItems="center"
                bgGradient="linear(to-br, gray.50, gray.100)"
            >
                <VStack spacing={4} p={6} bg="white" borderRadius="xl" boxShadow="lg">
                    <Text color="red.500" fontWeight="semibold">Something went wrong</Text>
                    <Text color="gray.600" fontSize="sm">{error}</Text>
                    <Button 
                        colorScheme="teal" 
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </VStack>
            </Flex>
        );
    }

    if (!isAuthenticated) {
        return <Loading />;
    }

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
                    minW={{ base: "90%", md: "600px" }} 
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
                    >
                        {/* Profile Header */}
                        <Flex align="center" gap={4}>
                            <Avatar.Root size="lg" variant="solid" colorPalette="teal">
                                <Avatar.Fallback name={username || "Yalmen"} />
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
                        
                        <Separator />
                        
                        <ProfileFolders />

                        <Spacer />
                        <Separator />
                        
                        {/* Logout Button - как было */}
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