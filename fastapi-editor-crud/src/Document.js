import React, { useState, useEffect, useRef } from 'react';
import { Flex, Box, Heading, Text, HStack, Input, IconButton, Spacer, Separator, Button } from "@chakra-ui/react";
import { Editor } from '@monaco-editor/react';
import { LuCopy, LuArrowLeft, LuShare2, LuSave, LuClock } from "react-icons/lu";
import { useParams, useNavigate } from 'react-router-dom';

const Document = () => {
    const { roomId, documentId } = useParams();
    const [ documentName, setDocumentName ] = useState();
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);
    const [ editorValue, setEditorValue ] = useState('');
    const [ isSaving, setIsSaving ] = useState(false);
    const [ saveMessage, setSaveMessage ] = useState(null);
    const [ lastAutoSave, setLastAutoSave ] = useState(null);
    const [ isAutoSaving, setIsAutoSaving ] = useState(false);
    
    const wsRef = useRef(null);
    const isConnectingRef = useRef(false);
    const autoSaveIntervalRef = useRef(null);
    const currentContentRef = useRef('');

    const shareUrl = `${window.location.origin}/rooms/${roomId}/documents/${documentId}`;
    const navigate = useNavigate();

    const copyShareLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setSaveMessage({ type: 'success', text: 'Link copied!' });
        setTimeout(() => setSaveMessage(null), 2000);
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
            currentContentRef.current = data['content'];
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = () => {
        navigate('/profile');
    };

    const saveDocument = async (content, isAutoSave = false) => {
        if (isAutoSave) {
            setIsAutoSaving(true);
        } else {
            setIsSaving(true);
        }
        
        try {
            const response = await fetch(`http://localhost:8000/rooms/${roomId}/documents/${documentId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'name': documentName,
                    'content': content,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save document.');
            }

            if (isAutoSave) {
                const now = new Date();
                setLastAutoSave(now);
                setSaveMessage({ 
                    type: 'success', 
                    text: `Auto-saved at ${now.toLocaleTimeString()}` 
                });
                setTimeout(() => setSaveMessage(null), 2000);
            } else {
                setSaveMessage({ 
                    type: 'success', 
                    text: 'Document saved successfully!' 
                });
                setTimeout(() => setSaveMessage(null), 2000);
            }
            
        } catch (err) {
            if (!isAutoSave) {
                setSaveMessage({ 
                    type: 'error', 
                    text: `Save failed: ${err.message}` 
                });
                setTimeout(() => setSaveMessage(null), 3000);
            } else {
                console.error('Auto-save failed:', err);
            }
        } finally {
            if (isAutoSave) {
                setIsAutoSaving(false);
            } else {
                setIsSaving(false);
            }
        }
    };

    const handleSaveAsNew = async () => {
        setIsSaving(true);
        setSaveMessage(null);
        
        const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(/[/:,]/g, '-').replace(/\s/g, '_');
        
        const newDocumentName = `${documentName}_copy_${timestamp}`;
        
        try {
            const response = await fetch(`http://localhost:8000/rooms/${roomId}/documents`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'name': newDocumentName,
                    'content': editorValue,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save document.');
            }

            const data = await response.json();
            
            setSaveMessage({ 
                type: 'success', 
                text: `Saved as "${newDocumentName}"` 
            });
            setTimeout(() => setSaveMessage(null), 3000);
            
        } catch (err) {
            setSaveMessage({ 
                type: 'error', 
                text: `Save failed: ${err.message}` 
            });
            setTimeout(() => setSaveMessage(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const update = (text) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(text);
        }
        setEditorValue(text);
        currentContentRef.current = text;
    };

    // Setup auto-save interval
    useEffect(() => {
        if (loading) return;
        
        // Clear existing interval
        if (autoSaveIntervalRef.current) {
            clearInterval(autoSaveIntervalRef.current);
        }
        
        // Set up new interval (every 5 minutes = 300000 ms)
        autoSaveIntervalRef.current = setInterval(() => {
            if (currentContentRef.current && !isAutoSaving && !isSaving) {
                console.log('Auto-saving document...');
                saveDocument(currentContentRef.current, true);
            }
        }, 10000); // 5 minutes
        
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
        };
    }, [loading, documentId]);

    // Save on beforeunload (when closing tab or refreshing)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (currentContentRef.current) {
                // Save synchronously before leaving
                navigator.sendBeacon(
                    `http://localhost:8000/rooms/${roomId}/documents/${documentId}`,
                    JSON.stringify({
                        name: documentName,
                        content: currentContentRef.current
                    })
                );
            }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [roomId, documentId, documentName]);

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
            currentContentRef.current = event.data;
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
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
                display="flex"
                flexDirection="column"
            >
                {/* Header */}
                <Flex 
                    align="center"
                    justify="space-between"
                    p={4} 
                    borderBottom="1px"
                    borderColor="gray.100"
                    flexShrink={0}
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
                    {lastAutoSave && (
                        <HStack spacing={1}>
                            <LuClock size="12px" color="#718096" />
                            <Text fontSize="xs" color="gray.400">
                                Last auto-save: {lastAutoSave.toLocaleTimeString()}
                            </Text>
                        </HStack>
                    )}
                </Flex>

                {/* Share section */}
                <Box p={3} borderBottom="1px" borderColor="gray.100" bg="gray.50" flexShrink={0}>
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

                {/* Editor section - takes remaining space */}
                <Box flex={1} minH={0} p={0}>
                    <Editor 
                        height="100%"
                        language="python"
                        theme="vs-light"
                        options={{ minimap: { enabled: false } }}
                        value={editorValue}
                        onChange={update}
                    />
                </Box>

                {/* Message area */}
                {saveMessage && (
                    <Box p={2} flexShrink={0}>
                        <Text 
                            textAlign="center" 
                            fontSize="sm" 
                            color={saveMessage.type === 'success' ? 'teal.500' : 'teal.500'}
                        >
                            {saveMessage.text}
                        </Text>
                    </Box>
                )}
                
                {/* Buttons section */}
                <Box p={3} borderTop="1px" borderColor="gray.100" flexShrink={0}>
                    <HStack spacing={3} w="full">
                        <Button
                            size="sm"
                            flex={1}
                            variant="ghost"
                            leftIcon={<LuArrowLeft />}
                            onClick={handleReturn}
                        >
                            Back
                        </Button>
                        
                        <Button
                            size="sm"
                            flex={1}
                            variant="outline"
                            colorScheme="teal"
                            leftIcon={<LuSave />}
                            onClick={() => saveDocument(editorValue, false)}
                            isLoading={isSaving}
                            loadingText="Saving..."
                        >
                            Save
                        </Button>
                        
                        <Button
                            size="sm"
                            flex={1}
                            variant="ghost"
                            leftIcon={<LuSave />}
                            onClick={handleSaveAsNew}
                            isLoading={isSaving}
                            loadingText="Saving..."
                        >
                            Save as new
                        </Button>
                    </HStack>
                </Box>
            </Box>
        </Flex>
    );
};

export default Document;