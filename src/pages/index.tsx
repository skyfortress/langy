import { useState, useEffect } from "react";
import { Card } from "@/types/card";
import Link from "next/link";
import { Geist } from "next/font/google";
import Head from "next/head";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardInput, setCardInput] = useState({ front: "", back: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cards");
      if (!response.ok) {
        throw new Error("Failed to fetch cards");
      }
      const data = await response.json();
      setCards(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!cardInput.front.trim() || !cardInput.back.trim()) {
      setError("Both Portuguese and English texts are required");
      return;
    }

    try {
      const response = await fetch("/api/cards/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardInput),
      });

      if (!response.ok) {
        throw new Error("Failed to create card");
      }

      setCardInput({ front: "", back: "" });
      setSuccess("Card added successfully!");
      fetchCards();
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to add card");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/cards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete card");
      }

      setSuccess("Card deleted successfully!");
      fetchCards();
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to delete card");
    }
  };

  return (
    <div className={`${geist.className} min-h-screen bg-slate-50`}>
      <Head>
        <title>Langy | Learn European Portuguese with AI</title>
        <meta
          name="description"
          content="Practice European Portuguese with an AI language tutor"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mr-3 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              Langy
            </h1>
            <p className="text-slate-600 hidden sm:block">
              Learn European Portuguese with AI
            </p>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-4">
              Learn European Portuguese with AI
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Practice conversations, build vocabulary, and improve your European
              Portuguese language skills with our AI-powered learning tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Study Mode</h2>
              <Link
                href="/study"
                className="block w-full bg-emerald-600 text-white text-center py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 mb-4"
              >
                Start Studying
              </Link>
              <p className="text-sm text-slate-600">
                Review cards in both European Portuguese-to-English and
                English-to-European Portuguese modes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Language Chat</h2>
              <Link
                href="/chat"
                className="block w-full bg-purple-600 text-white text-center py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 mb-4"
              >
                Start Chatting
              </Link>
              <p className="text-sm text-slate-600">
                Practice your European Portuguese skills by chatting with an AI
                tutor. New words are automatically saved as flashcards.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Langy - European Portuguese Learning
              Assistant
            </p>
            <p className="text-slate-500 text-sm mt-2 sm:mt-0">
              Powered by Google Gemini & LangChain
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
