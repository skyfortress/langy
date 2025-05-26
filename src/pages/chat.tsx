import React, { useState } from 'react';
import Head from 'next/head';
import Chat from '../components/chat/Chat';
import { Geist } from "next/font/google";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const ChatPage: React.FC = () => {
  const [language, setLanguage] = useState('Portuguese');
  const languages = ['Portuguese', 'Spanish', 'French', 'German', 'Italian', 'Japanese', 'Mandarin'];

  return (
    <div className={`${geist.className} min-h-screen bg-slate-50 flex flex-col`}>
      <Head>
        <title>Language Practice Chat | Langy</title>
        <meta name="description" content="Practice your language skills with an AI tutor" />
      </Head>

      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Langy Chat
            </h1>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg shadow-inner">
              <label htmlFor="language-select" className="mr-2 text-slate-700 font-medium px-2">I want to practice:</label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border-0 bg-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-[calc(100vh-180px)] overflow-hidden bg-white rounded-lg shadow-md border border-slate-200">
          <Chat language={language} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Langy - Language Learning Assistant
            </p>
            <p className="text-slate-500 text-sm mt-2 sm:mt-0">
              Powered by Google Gemini & LangChain
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;