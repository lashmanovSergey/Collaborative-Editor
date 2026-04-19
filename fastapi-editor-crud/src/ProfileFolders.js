import React, {
  useState,
  useEffect,
} from "react"
import {
  HStack,
  IconButton,
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

  {/* States for Editing Nodes */}
  const [editingNode, setEditingNode] = useState(null);
  const [editValue, setEditValue] = useState('');

  const fetchCollection = async () => {
    try {
      setLoading(true);

      let username, rooms, documents;

      {/* Get Username */}
      await fetch("http://localhost:8000/me", {
        method: 'POST',
        credentials: 'include',
      }).then(async (response) => {
        return await response.json();
      }).then((data) => {
        username = data['username'];
      });

      {/* Get List of Rooms */}
      await fetch("http://localhost:8000/rooms", {
        method: 'GET',
        credentials: 'include',
      }).then(async (response) => {
        return await response.json();
      }).then((data) => {
        rooms = data['rooms'];
      });

      for (let i = 0; i < rooms.length; i++) {
        let documents;

        {/* Get List of Documents in Room */}
        await fetch(`http://localhost:8000/rooms/${rooms[i]['uuid']}/documents`, {
          method: 'GET',
          credentials: 'include',
        }).then(async (response) => {
          return await response.json();
        }).then((data) => {
          documents = data['documents'];
        })
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
              children: []
            },
            {
              id: 'shared',
              name: 'shared',
              childrenCount: 0,
              children: []
            }
          ]
        },
      });

      setCollection(treeCollection);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  {/* Node Action - Remove */}
  const removeNode = (props) => {
    setCollection(collection.remove([props.indexPath]));
  }

  {/* Node Action - Add */}
  const addNode = async (props) => {
    const { node, indexPath } = props;

    let children;

    if (isRoom(indexPath)) {
      let room;

      await fetch('http://localhost:8000/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Untitled'
        }),
        credentials: 'include',
      }).then(async (response) => {
        return await response.json();
      }).then((data) => {
        room = data;
      })

      children = [
        ...(node.children || []),
        {
          id: room['uuid'],
          name: room['name'],
          childrenCount: room['childrenCount'],
        }
      ]
    } else {
      let folder;

      await fetch(`http://localhost:8000/rooms/${node.id}/documents`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Untitled',
        }),
      }).then(async (response) => {
        return await response.json();
      }).then((data) => {
        folder = data;
      });

      children = [
        ...(node.children || []),
        {
          id: folder['uuid'],
          name: folder['name'],
        }
      ]
    }

    setCollection(collection.replace(indexPath, { ...node, children }))
  }

  {/* Node Action - Edit */}
  const startEditing = (node) => {
    setEditValue(node.name);
    setEditingNode(node);
  }

  const saveEdit = (node, indexPath) => {
    if (!editValue.trim()) return;
    const updatedNode = { ...node, name: editValue };
    setCollection(collection.replace(indexPath, updatedNode));
    setEditingNode(null);
    setEditValue("");
  }

  const cancelEdit = () => {
    setEditingNode(null);
    setEditValue("");
  }

  const handleKeyDown = (e, node, indexPath) => {
    if (e.key == 'Enter') {
      saveEdit(node, indexPath);
    } else if (e.key == 'Escape') {
      cancelEdit();
    }
  }

  if (loading) {
    return ( <Loading /> );
  }

  if (error) {
    return ( null );
  }

  if (!collection) {
    return ( null );
  }

  return (
    <TreeView.Root collection={collection} maxW="100%" animateContent>
      <TreeView.Tree>
        <TreeView.Node
          indentGuide={<TreeView.BranchIndentGuide />}
          render={({node, nodeState, indexPath}) => {
            if (editingNode?.id !== node.id) {
              return (
                nodeState.isBranch ? (
                  <TreeView.BranchControl role="">
                    <LuFolder />
                    <TreeView.BranchText>{node.name}</TreeView.BranchText>
                    <TreeNodeActions 
                      node={node}
                      indexPath={indexPath}
                      onRemove={removeNode}
                      onAdd={addNode}
                      onEdit={(node) => startEditing(node)}
                    />
                  </TreeView.BranchControl>
                ) : (
                  <TreeView.Item>
                    <LuFile />
                    <TreeView.ItemText>{node.name}</TreeView.ItemText>
                    <TreeNodeActions
                      node={node}
                      indexPath={indexPath}
                      onRemove={removeNode}
                      onAdd={addNode}
                      onEdit={(node) => startEditing(node)}
                    />
                  </TreeView.Item>
                )
              );
            } else {
              return (
                nodeState.isBranch ? (
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
                  <TreeView.Item>
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
                )
              );
            }
          }}
        >
        </TreeView.Node>
      </TreeView.Tree>
    </TreeView.Root>
  );
}

const TreeNodeActions = (props) => {
  const {onRemove, onAdd, onEdit, node} = props;

  const tree = useTreeViewContext();
  const isBranch = tree.collection.isBranchNode(node);

  return (
    <HStack
      gap="0.5"
      position="absolute"
      right="0"
      top="0"
      scale="0.8"
      css={{
        opacity: 0,
        "[role=treeitem]:hover &": {opacity: 1},
      }}
    >
      { isNodeEditable(props.indexPath) && (
        <IconButton
          size="xs"
          variant="ghost"
          aria-label="Rename node"
          onClick={() => {
            console.log("clicked");
            onEdit?.(node);
          }}
        >
          <LuPencil />
        </IconButton>
      )}
      { isNodeRemovable(props.indexPath) && (
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
            tree.expand([node.id]);
          }}
        >
          <LuPlus />
        </IconButton>
      )}
    </HStack>
  );
} 

export default ProfileFolders;