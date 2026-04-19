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

const Login = () => {
    // credentials
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [usernameEmpty, setUsernameEmpty] = useState(false);
    const [passwordEmpty, setPasswordEmpty] = useState(false);
    const [statusError, setStatusError] = useState(false);

    // handle redirects
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        // remove previous error
        setStatusError(false);

        // handle error: username is empty
        if (username === "") {
            setUsernameEmpty(true);
            return;
        }
        setUsernameEmpty(false);

        // handler error: password is empty
        if (password === "") {
            setPasswordEmpty(true);
            return;
        }
        setPasswordEmpty(false);

        try {
            // send auth request
            let response = await fetch('http://localhost:8000/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
                credentials: 'include',
            })

            // process response
            if (response.status === 200) {
                navigate('/profile');
            } else {
                setStatusError(true);
            }


        } catch (error) {
            console.log('network error');
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
                <Heading color="teal.400"> Welcome! </Heading>

                <Box minW={{ base:"90%", md:"468px" }} >
                    <form onSubmit={handleLogin}>
                        <Stack
                            spacing={4}
                            p="1rem"
                            backgroundColor="whiteAlpha.900"
                            boxShadow="md"
                        >
                            <Field.Root invalid={usernameEmpty}>
                                <Field.Label>Username:</Field.Label>
                                <Input
                                    type="username"
                                    value={username}
                                    placeholder="Enter your username..."
                                    onChange={(e)=>setUsername(e.target.value)}
                                />
                                <Field.ErrorText width="full">
                                    <Field.ErrorIcon/>
                                    Username is required
                                </Field.ErrorText>
                            </Field.Root>

                            <Field.Root invalid={passwordEmpty}>
                                <Field.Label>Password:</Field.Label>
                                <Input 
                                    type="password"
                                    value={password}
                                    placeholder="Enter your password..."
                                    onChange={(e)=>setPassword(e.target.value)}
                                />
                                <Field.ErrorText width="full">
                                    <Field.ErrorIcon/>
                                    Password is required!
                                </Field.ErrorText>
                            </Field.Root>
 
                            <Button
                                type="submit"
                                borderRadius={0}
                                variant="solid"
                                colorScheme="teal.100"
                                width="full"
                            >
                                Login
                            </Button>

                            <Field.Root invalid={statusError}>
                                <Field.ErrorText>
                                    <Field.ErrorIcon/>
                                    Invalid username or password!
                                </Field.ErrorText>
                            </Field.Root>
                        </Stack>
                    </form>
                </Box>
            </Stack>
            <Box>
                New to us? {" "}
                <Link color="teal.500" href="/register">
                    Register
                </Link>
            </Box>
        </Flex>
    );
}

export default Login;