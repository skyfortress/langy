import React from 'react';
import { ChatMessage as ChatMessageType, ToolCall } from '../../types/chat';
import ReactMarkdown from 'react-markdown';
import { FiFile, FiSearch, FiUser } from 'react-icons/fi';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ToolCallDisplay: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  if (toolCall.name === 'createCard') {
    const { word, translation, context } = toolCall.args;
    
    return (
      <div className="mt-2 p-1 sm:p-2 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center text-xs sm:text-sm text-green-800">
          <FiFile className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="font-medium">Flashcard created:</span>
        </div>
        <div className="mt-1 flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row">
            <span className="text-xs sm:text-sm font-medium sm:w-24">Word:</span>
            <span className="text-xs sm:text-sm">{word}</span>
          </div>
          <div className="flex flex-col sm:flex-row">
            <span className="text-xs sm:text-sm font-medium sm:w-24">Translation:</span>
            <span className="text-xs sm:text-sm">{translation}</span>
          </div>
          {context && (
            <div className="flex flex-col sm:flex-row">
              <span className="text-xs sm:text-sm font-medium sm:w-24">Context:</span>
              <span className="text-xs sm:text-sm">{context}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-2 sm:mr-3">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-purple-600 flex items-center justify-center text-white">
            <FiSearch className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-3 py-2 sm:px-4 sm:py-3 ${
        isUser 
          ? 'bg-purple-600 text-white shadow-sm' 
          : 'bg-slate-100 border border-slate-200 shadow-sm'
      }`}>
        <div className="text-sm md:text-base">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.toolCalls.map(toolCall => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
        
        <div className={`text-xs mt-1 ${isUser ? 'text-purple-200' : 'text-slate-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 ml-2 sm:ml-3">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-300 flex items-center justify-center text-white">
            <FiUser className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;