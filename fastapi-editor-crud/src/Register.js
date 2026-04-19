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

    // redirect handling
    const navigate = useNavigate();

    const checkPasswordsMismatch = () => {
        return password === passwordConfirm;
    }

    const handleRegistration = async (e) => {
        e.preventDefault();

        setStatusError(false);

        // handle error: username is empty
        if (username === ""){
            setUsernameEmpty(true);
            return;
        }
        setUsernameEmpty(false);

        // handle error: password is empty
        if (password === "") {
            setPasswordEmpty(true);
            return;
        }
        setPasswordEmpty(false);

        // handle error: password is empty
        if (passwordConfirm === "") {
            setPasswordConfirmEmpty(true);
            return;
        }
        setPasswordConfirmEmpty(false);

        // handle error: password and confirm password mismatch
        if (checkPasswordsMismatch() === false) {
            setPasswordsMismatch(true);
            return;
        }
        setPasswordsMismatch(false);

        try {
            let response = await fetch('http://localhost:8000/register', {
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

            if (response.ok) {
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
                <Heading color="teal.400"> Join us! </Heading>

                <Box minW={{ base:"90%", md:"468px" }} >
                    <form onSubmit={handleRegistration}>
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

                            <Field.Root invalid={passwordConfirmEmpty}>
                                <Field.Label>Confirm Password:</Field.Label>
                                <Input 
                                    type="password"
                                    value={passwordConfirm}
                                    placeholder="Confirm your password..."
                                    onChange={(e)=>setPasswordConfirm(e.target.value)}
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
                                Register
                            </Button>

                            <Field.Root invalid={statusError}>
                                <Field.ErrorText>
                                    <Field.ErrorIcon/>
                                    Failed to register. Please, try again!
                                </Field.ErrorText>
                            </Field.Root>

                            <Field.Root invalid={passwordsMismatch}>
                                <Field.ErrorText>
                                    <Field.ErrorIcon/>
                                    Passwords do not match!
                                </Field.ErrorText>
                            </Field.Root>
                        </Stack>
                    </form>
                </Box>
            </Stack>
            <Box>
                Already with us? {" "}
                <Link color="teal.500" href="/auth">
                    Login
                </Link>
            </Box>
        </Flex>
    );
}

export default Register;