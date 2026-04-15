import React, { useState, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { webSocketService } from '../services/websocket';

interface EditorProps {
  roomGuid: string;
  initialContent: string;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  isSaving?: boolean;
  showToolbarSave?: boolean;
}

const Editor: React.FC<EditorProps> = ({
  roomGuid,
  initialContent,
  onContentChange,
  onSave,
  readOnly = false,
  isSaving = false,
  showToolbarSave = true,
}) => {
  const [content, setContent] = useState(initialContent);
  const [language, setLanguage] = useState('plaintext');
  const [isConnected, setIsConnected] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    webSocketService.connect(roomGuid);

    webSocketService.on('connect', () => {
      setIsConnected(true);
    });

    webSocketService.on('content_change', (data: { content: string }) => {
      setContent(data.content);
    });

    webSocketService.on('cursor_change', (data: { position: { line: number; column: number } }) => {
      setCursorPosition(data.position);
    });

    webSocketService.on('user_joined', (data: { username: string }) => {
      console.log(`${data.username} joined the room`);
    });

    webSocketService.on('user_left', (data: { username: string }) => {
      console.log(`${data.username} left the room`);
    });

    return () => {
      webSocketService.disconnect();
      setIsConnected(false);
    };
  }, [roomGuid]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);

    webSocketService.sendContentChange(newContent);

    if (onContentChange) {
      onContentChange(newContent);
    }
  }, [onContentChange]);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editor.onDidChangeCursorPosition((e: any) => {
      const position = {
        line: e.position.lineNumber,
        column: e.position.column,
      };
      setCursorPosition(position);
      webSocketService.sendCursorChange(position);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave(editor.getValue());
      }
    });
  }, [onSave]);

  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
  };

  const languageOptions = [
    { value: 'plaintext', label: 'Plain Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'rust', label: 'Rust' },
    { value: 'go', label: 'Go' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'yaml', label: 'YAML' },
    { value: 'sql', label: 'SQL' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between p-5 border-b border-border-color bg-gradient-to-r from-bg-tertiary to-border-color/50">
        <div className="flex w-full items-center gap-8">
          <div className="flex items-center gap-3 border-r border-border-color/40 pr-6 connection-status">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
            <div className="flex flex-col gap-1">
              <span className={`text-sm font-medium ${isConnected ? 'text-success' : 'text-error'}`}>
                {isConnected ? 'Live Connected' : 'Disconnected'}
              </span>
              <span className="text-xs text-text-tertiary">
                {isConnected ? 'Real-time editing active' : 'Reconnecting...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 min-w-[240px]">
              <span className="text-sm text-text-secondary font-medium">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-bg-secondary border-2 border-border-color hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-xl px-4 py-2 text-sm text-white transition-all font-medium appearance-none"
                style={{ color: '#f3f4f6' }}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="editor-toolbar__save ml-auto">
          {onSave && showToolbarSave && (
            <button
              onClick={handleSave}
              className="btn"
            >
              {isSaving ? (
                <>
                  <span className="loading mr-2"></span>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[440px] bg-gradient-to-br from-bg-primary to-bg-secondary">
        <MonacoEditor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: true },
            fontSize: 15,
            fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
            wordWrap: 'on',
            automaticLayout: true,
            readOnly,
            theme: 'vs-dark',
            cursorStyle: 'line',
            cursorBlinking: 'smooth',
            scrollBeyondLastLine: true,
            renderLineHighlight: 'all',
            renderWhitespace: 'selection',
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabSize: 2,
            insertSpaces: true,
            lineHeight: 22,
            padding: { top: 16, bottom: 16 },
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            smoothScrolling: true,
          }}
        />
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-border-color bg-gradient-to-r from-bg-tertiary to-border-color/30 text-sm">
        <div className="flex items-center gap-6">
          <div className="status-block">
            <span className="text-text-secondary font-medium">Position:</span>
            <span className="text-white font-mono bg-bg-primary px-3 py-1 rounded-lg">
              Ln {cursorPosition.line}, Col {cursorPosition.column}
            </span>
          </div>

          <div className="status-divider" aria-hidden="true" />

          <div className="status-block">
            <span className="text-text-secondary font-medium">Length:</span>
            <span className="text-white font-mono bg-bg-primary px-3 py-1 rounded-lg">
              {content.length} chars
            </span>
          </div>

          <div className="status-divider" aria-hidden="true" />

          <div className="status-block">
            <span className="text-text-secondary font-medium">Lines:</span>
            <span className="text-white font-mono bg-bg-primary px-3 py-1 rounded-lg">
              {content.split('\n').length} lines
            </span>
          </div>
        </div>


        <div className="flex items-center space-x-4">
          <div className="text-text-secondary flex items-center space-x-2">
            <span className="text-xs">Ctrl+S to save</span>
          </div>

          <div className="h-6 w-px bg-border-color/50"></div>

          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-xs text-text-secondary">Auto-save enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
