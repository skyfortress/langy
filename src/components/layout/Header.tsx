import React from 'react';
import { Button } from 'antd';
import { AiOutlineLogout } from 'react-icons/ai';
import { useAuth } from '@/utils/authContext';

interface HeaderProps {
  showAuth?: boolean;
}

const Header = ({ showAuth = true }: HeaderProps) => {
  const { username, logout } = useAuth();

  return (
    <header className="mb-2 sm:mb-4 text-center px-2 sm:px-0 relative">
      <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-0 sm:mb-2">
        🇵🇹 Langy: Portuguese Flashcards
      </h1>
      <p className="text-sm sm:text-base text-slate-600 mt-0.5 sm:mt-1">Learn Portuguese with spaced repetition</p>
      {showAuth && (
        <div className="flex flex-col sm:block">
          <div className="sm:absolute sm:right-0 sm:top-1 flex items-center justify-center sm:justify-end gap-2 mb-2 mt-2 sm:mb-0">
            {username && (
              <span className="text-slate-600 text-sm sm:text-base">Hello, {username}</span>
            )}
            <Button 
              icon={<AiOutlineLogout />} 
              onClick={logout}
              danger
              size="small"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;