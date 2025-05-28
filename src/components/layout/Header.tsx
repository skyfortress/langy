import React from 'react';
import { BiWorld } from 'react-icons/bi';

const Header: React.FC = () => {
  return (
    <header className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">
        🇵🇹 Langy: Portuguese Flashcards
        </h1>
        <p className="text-slate-600">Learn Portuguese with spaced repetition</p>
    </header>
  );
};

export default Header;