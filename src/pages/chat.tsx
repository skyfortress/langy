import React from 'react';
import Head from 'next/head';
import Chat from '../components/chat/Chat';
import Header from '../components/layout/Header';
import BackButton from '../components/layout/BackButton';
import { Geist } from "next/font/google";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const ChatPage: React.FC = () => {
  return (
    <div className={`${geist.className} min-h-screen bg-slate-50 flex flex-col`}>
      <Head>
        <title>Language Practice Chat | Langy</title>
        <meta name="description" content="Practice your language skills with an AI tutor" />
      </Head>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Header />
        <BackButton />
        <div className="h-[calc(100vh-200px)] overflow-hidden bg-white rounded-lg shadow-md border border-slate-200">
          <Chat />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;