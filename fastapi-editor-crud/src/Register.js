import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Flex,
    Stack,
    Heading,
    Link,
    Box,
    Button,
    Field,
    Input,
} from '@chakra-ui/react'

const Register = () => {
    // credentials
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [usernameEmpty, setUsernameEmpty] = useState(false);
    const [passwordEmpty, setPasswordEmpty] = useState(false);
    const [passwordConfirmEmpty, setPasswordConfirmEmpty] = useState(false);
    const [passwordsMismatch, setPasswordsMismatch] = useState(false);
    const [statusError, setStatusError] = useState(false);
    const [usernameTaken, setUsernameTaken] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // redirect handling
    const navigate = useNavigate();

    const validateUsername = (username) => {
        if (username.length < 3) {
            return "Username must be at least 3 characters long";
        }
        if (username.length > 20) {
            return "Username must be at most 20 characters long";
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return "Username can only contain letters, numbers, and underscores";
        }
        return null;
    };

    const validatePassword = (password) => {
        if (password.length < 6) {
            return "Password must be at least 6 characters long";
        }
        if (password.length > 50) {
            return "Password must be at most 50 characters long";
        }
        return null;
    };

    const handleRegistration = async (e) => {
        e.preventDefault();

        // Reset all errors
        setStatusError(false);
        setUsernameTaken(false);
        setUsernameEmpty(false);
        setPasswordEmpty(false);
        setPasswordConfirmEmpty(false);
        setPasswordsMismatch(false);

        // Validate username not empty
        if (username === "") {
            setUsernameEmpty(true);
            return;
        }
        setUsernameEmpty(false);

        // Validate username format
        const usernameError = validateUsername(username);
        if (usernameError) {
            setStatusError(true);
            return;
        }

        // Validate password not empty
        if (password === "") {
            setPasswordEmpty(true);
            return;
        }
        setPasswordEmpty(false);

        // Validate password format
        const passwordError = validatePassword(password);
        if (passwordError) {
            setStatusError(true);
            return;
        }

        // Validate password confirmation not empty
        if (passwordConfirm === "") {
            setPasswordConfirmEmpty(true);
            return;
        }
        setPasswordConfirmEmpty(false);

        // Validate passwords match
        if (password !== passwordConfirm) {
            setPasswordsMismatch(true);
            return;
        }
        setPasswordsMismatch(false);

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'username': username,
                    'password': password,
                    'password_confirm': passwordConfirm,
                }),
                credentials: 'include',
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                navigate('/profile');
            } else {
                // Handle specific error cases
                if (response.status === 400) {
                    if (data.detail === "Username already exists" || 
                        data.detail?.includes("already exists")) {
                        setUsernameTaken(true);
                    } else {
                        setStatusError(true);
                    }
                } else if (response.status === 422) {
                    setStatusError(true);
                } else if (response.status === 500) {
                    setStatusError(true);
                } else {
                    setStatusError(true);
                }
            }
        } catch (error) {
            console.error('Network error:', error);
            setStatusError(true);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Flex
            height="100vh"
            width="100wh"
            flexDirection="column"
            backgroundColor="gray.100"
            justifyContent="center"
            alignItems="center"
        >
            <Stack
                flexDir="column"
                mb="2"
                justifyContent="center"
                alignItems="center"
            >
                <Heading color="teal.400"> Join us! </Heading>

                <Box minW={{ base: "90%", md: "468px" }}>
                    <form onSubmit={handleRegistration}>
                        <Stack
                            spacing={4}
                            p="1rem"
                            backgroundColor="whiteAlpha.900"
                            boxShadow="md"
                        >
                            <Field.Root invalid={usernameEmpty || usernameTaken}>
                                <Field.Label>Username:</Field.Label>
                                <Input
                                    type="text"
                                    value={username}
                                    placeholder="Enter your username..."
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Field.ErrorText width="full">
                                    <Field.ErrorIcon />
                                    {usernameEmpty && "Username is required"}
                                    {usernameTaken && "Username is already taken"}
                                </Field.ErrorText>
                                <Field.HelperText fontSize="xs" color="gray.500">
                                    Username must be 3-20 characters (letters, numbers, underscores)
                                </Field.HelperText>
                            </Field.Root>

                            <Field.Root invalid={passwordEmpty}>
                                <Field.Label>Password:</Field.Label>
                                <Input
                                    type="password"
                                    value={password}
                                    placeholder="Enter your password..."
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Field.ErrorText width="full">
                                    <Field.ErrorIcon />
                                    Password is required!
                                </Field.ErrorText>
                                <Field.HelperText fontSize="xs" color="gray.500">
                                    Password must be at least 6 characters long
                                </Field.HelperText>
                            </Field.Root>

                            <Field.Root invalid={passwordConfirmEmpty}>
                                <Field.Label>Confirm Password:</Field.Label>
                                <Input
                                    type="password"
                                    value={passwordConfirm}
                                    placeholder="Confirm your password..."
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Field.ErrorText width="full">
                                    <Field.ErrorIcon />
                                    Password confirmation is required!
                                </Field.ErrorText>
                            </Field.Root>

                            <Button
                                type="submit"
                                borderRadius={0}
                                variant="solid"
                                colorScheme="teal"
                                width="full"
                                loading={isLoading}
                                loadingText="Registering..."
                            >
                                Register
                            </Button>

                            <Field.Root invalid={statusError}>
                                <Field.ErrorText>
                                    <Field.ErrorIcon />
                                    Failed to register. Please try again!
                                </Field.ErrorText>
                            </Field.Root>

                            <Field.Root invalid={passwordsMismatch}>
                                <Field.ErrorText>
                                    <Field.ErrorIcon />
                                    Passwords do not match!
                                </Field.ErrorText>
                            </Field.Root>
                        </Stack>
                    </form>
                </Box>
            </Stack>
            <Box>
                Already with us? {" "}
                <Link color="teal.500" href="/auth" onClick={(e) => {
                    e.preventDefault();
                    navigate('/auth');
                }}>
                    Login
                </Link>
            </Box>
        </Flex>
    );
}

export default Register;