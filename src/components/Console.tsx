import React from 'react';
import { VscClearAll, VscChevronDown, VscChevronUp } from 'react-icons/vsc';

export interface ConsoleMessage {
  id: string;
  method: 'log' | 'error' | 'warn' | 'info';
  args: string[];
  timestamp: number;
}

interface ConsoleProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const Console: React.FC<ConsoleProps> = ({
  messages,
  onClear,
  isExpanded,
  onToggle,
}) => {
  const getMessageColor = (method: ConsoleMessage['method']) => {
    switch (method) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-200';
    }
  };

  const getMethodIcon = (method: ConsoleMessage['method']) => {
    switch (method) {
      case 'error':
        return '✕';
      case 'warn':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '›';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title={isExpanded ? 'Collapse Console' : 'Expand Console'}
          >
            {isExpanded ? (
              <VscChevronDown className="w-4 h-4 text-gray-300" />
            ) : (
              <VscChevronUp className="w-4 h-4 text-gray-300" />
            )}
          </button>
          <span className="text-sm font-medium text-gray-300">Console</span>
          <span className="text-xs text-gray-500">({messages.length})</span>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-700 rounded transition-colors"
          title="Clear Console"
        >
          <VscClearAll className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">Clear</span>
        </button>
      </div>

      {/* Messages */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              Console output will appear here
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 py-1 px-2 hover:bg-gray-800/50 rounded ${getMessageColor(
                  message.method
                )}`}
              >
                <span className="flex-shrink-0 opacity-70">
                  {getMethodIcon(message.method)}
                </span>
                <div className="flex-1 whitespace-pre-wrap break-words">
                  {message.args.join(' ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
