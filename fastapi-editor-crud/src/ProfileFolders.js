import React, {
  useState,
  useEffect,
} from "react"
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Portal,
  Text,
  TreeView,
  createTreeCollection,
  useTreeViewContext,
  Input,
} from "@chakra-ui/react"
import { 
  LuFile,
  LuFolder,
  LuPlus,
  LuTrash,
  LuPencil
} from "react-icons/lu"
import Loading from './Loading'
import {useNavigate} from 'react-router-dom'

{/* Helper Function */}
const isNodeRemovable = (indexPath) => {
  return (indexPath?.length - 1 >= 1);
}

{/* Helper Function */}
const isNodeEditable = (indexPath) => {
  return (indexPath?.length - 1 !== 0);
}

{/* Helper Function */}
const isNodeShared = (name) => {
  return name === "shared";
}

{/* Helper Function */}
const isRoom = (indexPath) => {
  return (indexPath?.length - 1 === 0)
}

{/* Main Component - Profile Folders and Files */}
const ProfileFolders = () => {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmationDialog, setConfirmationDialog] = useState(null);

  {/* States for Editing Nodes */}
  const [editingNode, setEditingNode] = useState(null);
  const [editValue, setEditValue] = useState('');

  const navigate = useNavigate();

  // Простые уведомления через alert (можно заменить на любой другой способ)
  const showError = (message) => {
    console.error(message);
  };

  const showSuccess = (message) => {
    console.log(message);
  };

  const closeConfirmationDialog = (confirmed) => {
    if (confirmationDialog?.resolve) {
      confirmationDialog.resolve(confirmed);
    }
    setConfirmationDialog(null);
  };

  const confirmAction = ({ title, description, confirmLabel, tone = "teal" }) => {
    return new Promise((resolve) => {
      setConfirmationDialog({
        title,
        description,
        confirmLabel,
        tone,
        resolve,
      });
    });
  };

  const fetchWithError = async (url, options, errorMessage) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`${errorMessage}: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      showError(err.message);
      throw err;
    }
  };

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);

      let username, rooms;

      {/* Get Username */}
      const userData = await fetchWithError("http://localhost:8000/me", {
        method: 'POST',
        credentials: 'include',
      }, "Failed to fetch user data");
      username = userData['username'];

      {/* Get List of Rooms */}
      const roomsData = await fetchWithError("http://localhost:8000/rooms", {
        method: 'GET',
        credentials: 'include',
      }, "Failed to fetch rooms");
      rooms = roomsData['rooms'] || [];

      for (let i = 0; i < rooms.length; i++) {
        rooms[i]['children'] = [];
        rooms[i]['childrenCount'] = 0;
        rooms[i]['id'] = rooms[i]['uuid'];
        delete rooms[i]['uuid'];

        try {
          const docsData = await fetch(`http://localhost:8000/rooms/${rooms[i]['id']}/documents`, {
            method: 'GET',
            credentials: 'include',
          }).then(res => res.ok ? res.json() : { documents: [] });
          
          const documents = docsData['documents'] || [];
          for (let j = 0; j < documents.length; j++) {
            rooms[i]['childrenCount'] += 1;
            rooms[i]['children'].push({
              id: documents[j]['document_uuid'] || documents[j]['uuid'],
              name: documents[j]['name'],
              room_id: rooms[i]['id'],
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch documents for room ${rooms[i]['id']}:`, err);
        }
      }

      const treeCollection = createTreeCollection({
        nodeToValue: (node) => node.id,
        nodeToString: (node) => node.name,
        rootNode: {
          id: 'ROOT',
          name: 'root',
          children: [
            {
              id: `${username}`,
              name: `${username}`,
              childrenCount: rooms.length,
              children: rooms
            }
          ]
        },
      });

      setCollection(treeCollection);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  const removeNode = async (props) => {
    const { node, indexPath } = props;
    const nodeType = indexPath.length - 1 === 1 ? 'room' : 'document';
    
    const isConfirmed = await confirmAction({
      title: `Delete ${nodeType}?`,
      description: `This will permanently delete "${node.name}".`,
      confirmLabel: 'Delete',
      tone: 'red',
    });

    if (!isConfirmed) return;

    try {
      if (indexPath.length - 1 === 1) {
        await fetch(`http://localhost:8000/rooms/${node.id}`, {
          method: 'DELETE',
          credentials: 'include',
        }).then(res => {
          if (!res.ok) throw new Error('Failed to remove Room');
        });
      } else {
        await fetch(`http://localhost:8000/rooms/${node.room_id}/documents/${node.id}`, {
          method: 'DELETE',
          credentials: 'include',
        }).then(res => {
          if (!res.ok) throw new Error('Failed to remove Document');
        });
      }

      setCollection(collection.remove([props.indexPath]));
      showSuccess(`${nodeType} deleted successfully`);
    } catch (err) {
      showError(err.message);
    }
  };

  const addNode = async (props) => {
    const { node, indexPath } = props;
    let children;

    try {
      if (isRoom(indexPath)) {
        const room = await fetchWithError('http://localhost:8000/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Untitled Room' }),
          credentials: 'include',
        }, "Failed to create room");

        children = [
          ...(node.children || []),
          {
            id: room['uuid'],
            name: room['name'],
            childrenCount: 0,
          }
        ];
        showSuccess("Room created");
      } else {
        const document = await fetchWithError(`http://localhost:8000/rooms/${node.id}/documents`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Untitled Document',
            content: '',
          }),
        }, "Failed to create document");

        children = [
          ...(node.children || []),
          {
            id: document['document_uuid'] || document['uuid'],
            name: document['name'],
            room_id: node.id,
          }
        ];
        showSuccess("Document created");
      }

      setCollection(collection.replace(indexPath, { ...node, children }));
    } catch (err) {
      showError(err.message);
    }
  };

  const startEditing = (node) => {
    setEditValue(node.name);
    setEditingNode(node);
  };

  const saveEdit = async (node, indexPath) => {
    if (!editValue.trim()) return;

    const nextName = editValue.trim();
    const nodeType = indexPath.length === 2 ? 'room' : 'document';

    if (nextName === node.name) {
      setEditingNode(null);
      setEditValue("");
      return;
    }

    const isConfirmed = await confirmAction({
      title: `Rename ${nodeType}?`,
      description: `Change "${node.name}" to "${nextName}"?`,
      confirmLabel: 'Save name',
      tone: 'teal',
    });

    if (!isConfirmed) {
      cancelEdit();
      return;
    }

    try {
      if (indexPath.length === 2) {
        const response = await fetch(`http://localhost:8000/rooms/${node.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: nextName }),
        });
        if (!response.ok) throw new Error('Failed to update Room name');
      } else {
        const response = await fetch(`http://localhost:8000/rooms/${node.room_id}/documents/${node.id}`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch document');
        
        const data = await response.json();

        const response2 = await fetch(`http://localhost:8000/rooms/${node.room_id}/documents/${node.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: nextName,
            content: data['content'],
          }),
        });
        if (!response2.ok) throw new Error('Failed to update Document');
      }

      const updatedNode = { ...node, name: nextName };
      setCollection(collection.replace(indexPath, updatedNode));
      showSuccess(`${nodeType} renamed successfully`);
    } catch (err) {
      showError(err.message);
    } finally {
      setEditingNode(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setEditValue("");
  };

  const handleKeyDown = (e, node, indexPath) => {
    if (e.key === 'Enter') {
      saveEdit(node, indexPath);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleDoubleClick = (e, node) => {
    if (node.room_id) {
      navigate(`/rooms/${node.room_id}/documents/${node.id}`);
    }
  };

  if (loading) return <Loading />;
  if (error) return null;
  if (!collection) return null;

  return (
    <>
      <TreeView.Root collection={collection} maxW="100%" animateContent>
        <TreeView.Tree>
          <TreeView.Node
            indentGuide={<TreeView.BranchIndentGuide />}
            render={({node, nodeState, indexPath}) => {
              if (editingNode?.id !== node.id) {
                return nodeState.isBranch ? (
                  <TreeView.BranchControl role="">
                    <LuFolder />
                    <TreeView.BranchText>{node.name}</TreeView.BranchText>
                    <TreeNodeActions 
                      node={node}
                      indexPath={indexPath}
                      onRemove={removeNode}
                      onAdd={addNode}
                      onEdit={startEditing}
                    />
                  </TreeView.BranchControl>
                ) : (
                  <TreeView.Item onDoubleClick={(e) => handleDoubleClick(e, node)}>
                    <LuFile />
                    <TreeView.ItemText>{node.name}</TreeView.ItemText>
                    <TreeNodeActions
                      node={node}
                      indexPath={indexPath}
                      onRemove={removeNode}
                      onAdd={addNode}
                      onEdit={startEditing}
                    />
                  </TreeView.Item>
                );
              } else {
                return nodeState.isBranch ? (
                  <TreeView.BranchControl role="">
                    <LuFolder />
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(node, indexPath)}
                      onKeyDown={(e) => handleKeyDown(e, node, indexPath)}
                      autoFocus
                      size="xs"
                      width="full"
                    />
                  </TreeView.BranchControl>
                ) : (
                  <TreeView.Item onDoubleClick={(e) => handleDoubleClick(e, node)}>
                    <LuFile />
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(node, indexPath)}
                      onKeyDown={(e) => handleKeyDown(e, node, indexPath)}
                      autoFocus
                      size="xs"
                      width="full"
                    />
                  </TreeView.Item>
                );
              }
            }}
          />
        </TreeView.Tree>
      </TreeView.Root>

      {confirmationDialog && (
        <Portal>
          <Flex
            position="fixed"
            inset="0"
            bg="blackAlpha.600"
            align="center"
            justify="center"
            zIndex="modal"
            p={4}
          >
            <Box
              w="full"
              maxW="420px"
              bg="white"
              borderRadius="2xl"
              boxShadow="2xl"
              p={6}
            >
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                {confirmationDialog.title}
              </Text>
              <Text mt={2} fontSize="sm" color="gray.500">
                {confirmationDialog.description}
              </Text>
              <HStack mt={6} justify="flex-end">
                <Button variant="ghost" onClick={() => closeConfirmationDialog(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette={confirmationDialog.tone}
                  onClick={() => closeConfirmationDialog(true)}
                >
                  {confirmationDialog.confirmLabel}
                </Button>
              </HStack>
            </Box>
          </Flex>
        </Portal>
      )}
    </>
  );
};

const TreeNodeActions = (props) => {
  const { onRemove, onAdd, onEdit, node } = props;

  const tree = useTreeViewContext();
  const isBranch = tree.collection?.isBranchNode(node);

  return (
    <HStack
      gap="0.5"
      position="absolute"
      right="0"
      top="0"
      scale="0.8"
      css={{
        opacity: 0,
        "[role=treeitem]:hover &": { opacity: 1 },
      }}
    >
      {isNodeEditable(props.indexPath) && (
        <IconButton
          size="xs"
          variant="ghost"
          aria-label="Rename node"
          onClick={() => onEdit?.(node)}
        >
          <LuPencil />
        </IconButton>
      )}
      {isNodeRemovable(props.indexPath) && (
        <IconButton
          size="xs"
          variant="ghost"
          aria-label="Remove node"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(props);
          }}
        >
          <LuTrash />
        </IconButton>
      )}
      {isBranch && !isNodeShared(node.name) && (
        <IconButton
          size="xs"
          variant="ghost"
          aria-label="Add node"
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.(props);
            tree.expand?.([node.id]);
          }}
        >
          <LuPlus />
        </IconButton>
      )}
    </HStack>
  );
};

export default ProfileFolders;