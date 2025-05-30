import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType, ApiResponse, ChatSession } from '../../types/chat';
import { Button, Input } from 'antd';
import { IoSend, IoAdd } from 'react-icons/io5';
import { BiMessageDetail } from 'react-icons/bi';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const predefinedMessages = [
    "Create a flashcard for ",
    "Let's model a situation: ",
    "How do I say ",
    "Translate this phrase: ",
    "Explain this grammar concept: "
  ];

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/chat/history');
        
        if (response.ok) {
          const data = await response.json() as ChatSession;
          
          if (data.id) {
            setSessionId(data.id);
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadChatHistory();
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isInitialLoad]);

  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json() as ChatSession;
        setSessionId(data.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error creating new chat session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) {
      return;
    }
    
    const userMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: messages,
          sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json() as ApiResponse & { sessionId: string };
      
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      const assistantMessage = data.assistantMessage;
      
      if (assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0) {
        const cardCount = assistantMessage.toolCalls.filter(tool => tool.type === 'createCard').length;
        if (cardCount > 0) {
          const notification = document.createElement('div');
          notification.className = 'fixed bottom-2 sm:bottom-4 right-2 sm:right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-2 sm:p-4 rounded shadow-md max-w-[calc(100%-1rem)] sm:max-w-md z-50';
          notification.innerHTML = `
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-4 w-4 sm:h-5 sm:w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-2 sm:ml-3">
                <p class="text-xs sm:text-sm">${cardCount} new flashcard${cardCount > 1 ? 's' : ''} created from your conversation!</p>
              </div>
            </div>
          `;
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.remove();
          }, 5000);
        }
      }
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your message. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePredefinedMessage = (message: string) => {
    setInputValue(message);
  };
  
  return (
    <div className="flex flex-col h-full bg-white shadow-md rounded-lg overflow-hidden border border-slate-200">
      <div className="bg-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg sm:text-xl font-semibold">Chat in European Portuguese</h2>
        <Button 
          icon={<IoAdd />} 
          onClick={handleNewChat}
          className="bg-white text-purple-600 hover:bg-purple-50 border-white text-sm sm:text-base"
          disabled={isLoading}
          size="middle"
        >
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 my-4 sm:my-8 space-y-3 sm:space-y-4 px-2 sm:px-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-purple-100 flex items-center justify-center">
              <BiMessageDetail className="h-8 w-8 sm:h-12 sm:w-12 text-purple-500" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-medium text-slate-700">Start chatting to practice your European Portuguese!</p>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                Try asking questions, practicing sentences, or learning about culture.
              </p>
              <p className="mt-1 text-xs sm:text-sm text-purple-600 font-medium">
                New words will automatically be saved as flashcards.
              </p>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        {isLoading && (
          <div className="flex justify-start mb-3 sm:mb-4">
            <div className="bg-slate-100 rounded-lg px-3 py-1 sm:px-4 sm:py-2">
              <div className="flex space-x-1 sm:space-x-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex flex-wrap gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 bg-purple-50 border-t border-purple-100">
        {predefinedMessages.map((message, index) => (
          <Button
            key={index}
            onClick={() => handlePredefinedMessage(message)}
            className="text-purple-600 border-purple-200 hover:bg-purple-100 text-xs sm:text-sm px-2 py-1 h-auto"
            disabled={isLoading}
            size="small"
          >
            {message}
          </Button>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-2 sm:p-4">
        <div className="flex items-center">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button
            type="primary"
            htmlType="submit"
            icon={<IoSend />}
            className="ml-2"
            disabled={isLoading || !inputValue.trim()}
            shape="circle"
            size="middle"
          />
        </div>
      </form>
    </div>
  );
};

export default Chat;