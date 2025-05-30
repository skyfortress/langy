import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="mb-2 sm:mb-4 text-center px-2 sm:px-0">
      <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-0 sm:mb-2">
        🇵🇹 Langy: Portuguese Flashcards
      </h1>
      <p className="text-xs sm:text-base text-slate-600 mt-0.5 sm:mt-1">Learn Portuguese with spaced repetition</p>
    </header>
  );
};

export default Header;