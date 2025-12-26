
import React from 'react';
import { Card } from '../types';

interface CardItemProps {
  card: Card;
  onClick: (id: number) => void;
  disabled: boolean;
}

const CardItem: React.FC<CardItemProps> = ({ card, onClick, disabled }) => {
  const handleClick = () => {
    if (!disabled && !card.isFlipped && !card.isMatched) {
      onClick(card.id);
    }
  };

  return (
    <div 
      className="perspective w-full h-24 sm:h-32 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
      onClick={handleClick}
    >
      <div className={`relative w-full h-full duration-500 preserve-3d ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}>
        {/* Front Face (Hidden Card) */}
        <div className="absolute inset-0 w-full h-full bg-indigo-600 rounded-xl flex items-center justify-center backface-hidden shadow-lg border-4 border-indigo-400">
          <div className="w-10 h-10 bg-indigo-500 rounded-full opacity-50 flex items-center justify-center">
             <span className="text-white font-bold text-xl">?</span>
          </div>
        </div>

        {/* Back Face (Revealed Card) */}
        <div className={`absolute inset-0 w-full h-full bg-white rounded-xl flex items-center justify-center backface-hidden rotate-y-180 shadow-md border-2 ${card.isMatched ? 'border-green-400 bg-green-50' : 'border-indigo-100'}`}>
          <span className="text-4xl sm:text-5xl select-none transform transition-transform duration-500 group-hover:scale-110">
            {card.content}
          </span>
          {card.isMatched && (
            <div className="absolute top-1 right-1">
              <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Match</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardItem;
