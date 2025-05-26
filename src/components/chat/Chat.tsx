import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType, ApiResponse, ChatSession } from '../../types/chat';
import { Button, Input } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          notification.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md';
          notification.innerHTML = `
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm">${cardCount} new flashcard${cardCount > 1 ? 's' : ''} created from your conversation!</p>
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
  
  return (
    <div className="flex flex-col h-full bg-white shadow-md rounded-lg overflow-hidden border border-slate-200">
      <div className="bg-purple-600 text-white px-6 py-4 shadow-sm">
        <h2 className="text-xl font-semibold">Chat in European Portuguese</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 my-8 space-y-4">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-slate-700">Start chatting to practice your European Portuguese!</p>
              <p className="mt-2 text-sm text-slate-500">
                Try asking questions, practicing sentences, or learning about culture.
              </p>
              <p className="mt-1 text-sm text-purple-600 font-medium">
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
          <div className="flex justify-start mb-4">
            <div className="bg-slate-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
        <div className="flex items-center">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message in English or European Portuguese..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            className="ml-2"
            disabled={isLoading || !inputValue.trim()}
            shape="circle"
          />
        </div>
      </form>
    </div>
  );
};

export default Chat;