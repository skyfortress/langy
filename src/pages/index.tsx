import { useState, useEffect } from "react";
import { Card } from "@/types/card";
import Link from "next/link";
import { Geist } from "next/font/google";
import { Button, Input, Alert } from "antd";
import { AiOutlineDelete } from "react-icons/ai";
import { FiPlus } from "react-icons/fi";
import { IoLanguage } from "react-icons/io5";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

interface CardStats {
  new: number;
  learn: number;
  due: number;
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardInput, setCardInput] = useState({ front: "", back: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cardStats, setCardStats] = useState<CardStats>({ new: 0, learn: 0, due: 0 });

  useEffect(() => {
    fetchCards();
    fetchCardStats();
  }, []);

  const fetchCardStats = async () => {
    try {
      const response = await fetch("/api/cards/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch card statistics");
      }
      const stats = await response.json();
      setCardStats(stats);
    } catch (error) {
      console.error("Error:", error);
    }
  };

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
    <div className={`${geist.className} min-h-screen bg-slate-50 p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            🇵🇹 Langy: Portuguese Flashcards
          </h1>
          <p className="text-slate-600">Learn Portuguese with spaced repetition</p>
        </header>

        {(error || success) && (
          <div className="max-w-md mx-auto mb-6">
            {error && (
              <Alert message={error} type="error" showIcon className="mb-4" />
            )}
            {success && (
              <Alert message={success} type="success" showIcon className="mb-4" />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Add New Card</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="front"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Portuguese (Front)
                  </label>
                  <Input
                    id="front"
                    value={cardInput.front}
                    onChange={(e) =>
                      setCardInput({ ...cardInput, front: e.target.value })
                    }
                    placeholder="e.g., Bom dia"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="back"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    English (Back)
                  </label>
                  <Input
                    id="back"
                    value={cardInput.back}
                    onChange={(e) =>
                      setCardInput({ ...cardInput, back: e.target.value })
                    }
                    placeholder="e.g., Good morning"
                  />
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                >
                  Add Card
                </Button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Study Mode</h2>
                <div className="flex mb-4 justify-between text-sm">
                  <div className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                    New: {cardStats.new}
                  </div>
                  <div className="px-2 py-1 rounded bg-amber-100 text-amber-800">
                    Learn: {cardStats.learn}
                  </div>
                  <div className="px-2 py-1 rounded bg-green-100 text-green-800">
                    Due: {cardStats.due}
                  </div>
                </div>
                <Link href="/study" className="block w-full mb-4">
                  <Button type="primary" block style={{ backgroundColor: '#059669' }}>
                    Start Studying
                  </Button>
                </Link>
                <p className="text-sm text-slate-600">
                  Review cards in both Portuguese-to-English and
                  English-to-Portuguese modes.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Language Chat</h2>
                <Link href="/chat" className="block w-full mb-4">
                  <Button type="primary" block style={{ backgroundColor: '#9333ea' }}>
                    Practice with AI Tutor
                  </Button>
                </Link>
                <p className="text-sm text-slate-600">
                  Chat with an AI language tutor to practice conversation skills.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  Your Flashcards ({cards.length})
                </h2>
                {cards.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {cards.filter((card) => card.reviewCount > 0).length} reviewed
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-slate-600">Loading cards...</p>
                </div>
              ) : cards.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-40 text-center">
                  <p className="text-slate-600 mb-4">
                    No cards yet. Add your first card to get started!
                  </p>
                  <FiPlus className="w-16 h-16 text-slate-300" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="border border-slate-200 rounded-md p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {card.front}
                          </p>
                          <p className="text-slate-600">{card.back}</p>
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<AiOutlineDelete />}
                          onClick={() => handleDelete(card.id)}
                          aria-label="Delete card"
                        />
                      </div>
                      {card.reviewCount > 0 && (
                        <div className="mt-2 text-xs text-slate-500 flex justify-between border-t pt-2 border-slate-100">
                          <span>
                            Reviews: {card.reviewCount} | Success:{" "}
                            {Math.round(
                              (card.correctCount / card.reviewCount) * 100
                            )}
                            %
                          </span>
                          <span>
                            {card.lastReviewed
                              ? new Date(card.lastReviewed).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
