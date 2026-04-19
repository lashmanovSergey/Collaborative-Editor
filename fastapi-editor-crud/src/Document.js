import React, { useState, useEffect, useRef } from 'react';
import { Flex, Box, Heading, Text, HStack, Input, IconButton, Spacer, Separator } from "@chakra-ui/react";
import { Editor } from '@monaco-editor/react';
import { LuCopy, LuArrowLeft, LuShare2 } from "react-icons/lu";
import { useParams, useNavigate } from 'react-router-dom';

const Document = () => {
    const { roomId, documentId } = useParams();
    const [ documentName, setDocumentName ] = useState();
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);
    const [ editorValue, setEditorValue ] = useState('');
    
    const wsRef = useRef(null);
    const isConnectingRef = useRef(false);

    const shareUrl = `${window.location.origin}/rooms/${roomId}/documents/${documentId}`;
    const navigate = useNavigate();

    const copyShareLink = () => {
        navigator.clipboard.writeText(shareUrl);
    };

    const fetchDocumentName = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8000/rooms/${roomId}/documents/${documentId}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('HTTP Error! Failed to get document name.');
            }

            const data = await response.json();
            setDocumentName(data['name']);
            setEditorValue(data['content']);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = () => {
        navigate('/profile');
    };

    const update = (text) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(text);
        }
        setEditorValue(text);
    };

    useEffect(() => {
        fetchDocumentName();
    }, []); 

    useEffect(() => {
        if (wsRef.current || isConnectingRef.current) { return; }
        
        if (loading) { return; }

        isConnectingRef.current = true;

        const ws = new WebSocket(`ws://localhost:8000/rooms/${roomId}/documents/ws/${documentId}`);
        
        ws.onopen = () => {
            isConnectingRef.current = false;
        };
        
        ws.onmessage = (event) => {
            setEditorValue(event.data);
        };
        
        ws.onerror = (error) => {
            isConnectingRef.current = false;
        };
        
        ws.onclose = () => {
            wsRef.current = null;
            isConnectingRef.current = false;
        };
        
        wsRef.current = ws;

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            isConnectingRef.current = false;
        };
    }, [loading]);

    if (loading) {
        return <Text color="teal.100">Loading...</Text>;
    }

    if (error) {
        return <Text>{error}</Text>;
    }

    return (
        <Flex 
            height="100vh"
            width="100%"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            p={4}
        >
            <Box
                maxW="1200px"
                w="full"
                h="90vh"
                bg="white"
                rounded="2xl"
                shadow="lg"
                overflow="hidden"
            >
                <Flex 
                    align="center"
                    justify="space-between"
                    p={4} 
                    borderBottom="1px"
                    borderColor="gray.100"
                >
                    <Box>
                        <Heading
                            size="xs"
                            color="teal.500"
                            textTransform="uppercase"
                            letterSpacing="wide"
                        >
                            Document
                        </Heading>
                        <Heading size="sm" mt={1} color="gray.500">
                            {documentName}
                        </Heading>
                    </Box>
                </Flex>

                <Box p={3} mb={4} borderTop="1px" borderColor="gray.100" bg="gray.50">
                    <HStack spacing={2}>
                        <LuShare2 size="16px" color="#718096" />
                        <Text
                            fontSize="xs"
                            color="gray.500"
                            fontWeight="medium"
                            flexShrink={0}
                        >
                            Share link
                        </Text>
                        <Input value={shareUrl} size="xs" variant="unstyled" fontSize="xs" fontFamily="mono" isReadOnly />
                        <IconButton 
                            size="xs"
                            variant="ghost"
                            aria-label="Copy"
                            onClick={copyShareLink}
                        >
                            <LuCopy />
                        </IconButton>
                    </HStack>
                </Box>

                <Box h="calc(100% - 200px)">
                    <Editor 
                        height="90%"
                        language="python"
                        theme="vs-light"
                        options={{ minimap: { enabled: false } }}
                        value={editorValue}
                        onChange={update}
                    />
                </Box>

                <Spacer />
                <Separator p={1}/>

                <IconButton
                    size="sm"
                    w='full'
                    variant="ghost"
                    colorScheme="black"
                    aria-label="Logout"
                    onClick={handleReturn}
                >
                    <LuArrowLeft />
                </IconButton>
            </Box>
        </Flex>
    );
};

export default Document;