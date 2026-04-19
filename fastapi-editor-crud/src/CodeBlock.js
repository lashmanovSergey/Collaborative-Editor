import React from 'react'
import { Editor } from '@monaco-editor/react'

const CodeBlock = () => {
    return (
        <Editor 
            height='250px'
            language='javascript'
            theme='light'
        />
    );
}

export default CodeBlock;