import React from 'react';
import { ChatMessage as ChatMessageType, ToolCall } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ToolCallDisplay: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  if (toolCall.name === 'createCard') {
    const { word, translation, context } = toolCall.args;
    
    return (
      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center text-sm text-green-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
          <span className="font-medium">Flashcard created:</span>
        </div>
        <div className="mt-1 flex flex-col gap-1">
          <div className="flex">
            <span className="text-sm font-medium w-24">Word:</span>
            <span className="text-sm">{word}</span>
          </div>
          <div className="flex">
            <span className="text-sm font-medium w-24">Translation:</span>
            <span className="text-sm">{translation}</span>
          </div>
          {context && (
            <div className="flex">
              <span className="text-sm font-medium w-24">Context:</span>
              <span className="text-sm">{context}</span>
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
      
      <div className={`max-w-[70%] rounded-lg px-4 py-3 ${
        isUser 
          ? 'bg-purple-600 text-white shadow-sm' 
          : 'bg-slate-100 border border-slate-200 shadow-sm'
      }`}>
        <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
        
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
        <div className="flex-shrink-0 ml-3">
          <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;