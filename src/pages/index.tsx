import { useState, useEffect } from "react";
import { Card } from "@/types/card";
import Link from "next/link";
import { Geist } from "next/font/google";

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
    <div className={`${geist.className} min-h-screen bg-slate-50 p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            🇧🇷 Langy: Portuguese Flashcards
          </h1>
          <p className="text-slate-600">Learn Portuguese with spaced repetition</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Add New Card</h2>
              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="front"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Portuguese (Front)
                  </label>
                  <input
                    type="text"
                    id="front"
                    value={cardInput.front}
                    onChange={(e) =>
                      setCardInput({ ...cardInput, front: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <input
                    type="text"
                    id="back"
                    value={cardInput.back}
                    onChange={(e) =>
                      setCardInput({ ...cardInput, back: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Good morning"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Card
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Study</h2>
              <Link
                href="/study"
                className="block w-full bg-emerald-600 text-white text-center py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Start Studying
              </Link>
              <p className="mt-3 text-sm text-slate-600">
                Cards will be presented in both Portuguese-to-English and
                English-to-Portuguese modes.
              </p>
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Your Flashcards ({cards.length})
              </h2>

              {loading ? (
                <p className="text-slate-600">Loading cards...</p>
              ) : cards.length === 0 ? (
                <p className="text-slate-600">
                  No cards yet. Add your first card to get started!
                </p>
              ) : (
                <div className="space-y-4">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="border border-slate-200 rounded-md p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {card.front}
                          </p>
                          <p className="text-slate-600">{card.back}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Delete card"
                        >
                          &times;
                        </button>
                      </div>
                      {card.reviewCount > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          <p>
                            Reviews: {card.reviewCount} | Success rate:{" "}
                            {Math.round(
                              (card.correctCount / card.reviewCount) * 100
                            )}
                            %
                          </p>
                          <p>
                            Last reviewed:{" "}
                            {card.lastReviewed
                              ? new Date(card.lastReviewed).toLocaleDateString()
                              : "Never"}
                          </p>
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
