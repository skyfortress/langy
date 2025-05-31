import { useState, useEffect } from "react";
import { Card } from "@/types/card";
import { Modal, Button } from "antd";

interface LearnedWordsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LearnedWordsModal = ({ visible, onClose }: LearnedWordsModalProps) => {
  const [learnedCards, setLearnedCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      fetchLearnedCards();
    }
  }, [visible]);

  const fetchLearnedCards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cards/learned");
      if (!response.ok) {
        throw new Error("Failed to fetch learned cards");
      }
      const data = await response.json();
      setLearnedCards(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load learned cards");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Learned Words"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={800}
    >
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <p className="text-slate-600">Loading learned words...</p>
          </div>
        ) : learnedCards.length === 0 ? (
          <p className="text-slate-600 text-center py-4">
            No learned words found.
          </p>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {learnedCards.map((card) => (
                <div
                  key={card.id}
                  className="border border-slate-200 rounded-md p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <p className="font-semibold text-slate-800">{card.front}</p>
                  <p className="text-slate-600">{card.back}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};