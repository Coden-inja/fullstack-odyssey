import React, { useEffect, useState } from 'react';
import { QuizQuestion } from '../types';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface QuizModalProps {
  quiz: QuizQuestion;
  actTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onPassedQuiz: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quiz,
  actTitle,
  isOpen,
  onClose,
  onPassedQuiz
}) => {
  // Hooks must run before the early return, or closing the modal crashes React
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setSelectedOption(null);
    setIsSubmitted(false);
  }, [quiz, isOpen]);

  if (!isOpen) return null;

  const isCorrect = selectedOption === quiz.correctIndex;

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  return (
    <div className="quiz-modal-backdrop" onClick={onClose}>
      <div className="quiz-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Eyebrow Pill directly inspired by Frontend Master / Image 2 */}
        <div className="quiz-modal-eyebrow">
          <span className="eyebrow-pill">
            <span className="eyebrow-dot" /> CHECK YOURSELF &middot; {actTitle.toUpperCase()}
          </span>
          <button className="quiz-close-x" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        {/* Question Heading in Bricolage Grotesque */}
        <div className="quiz-question-box">
          <h3 className="quiz-question-title">{quiz.question}</h3>
        </div>

        {/* Options List */}
        <div className="quiz-options-list">
          {quiz.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let optionClass = 'quiz-option-card';
            if (isSelected) optionClass += ' selected';
            if (isSubmitted) {
              if (idx === quiz.correctIndex) optionClass += ' correct';
              else if (isSelected) optionClass += ' wrong';
            }

            return (
              <button
                key={idx}
                className={optionClass}
                disabled={isSubmitted}
                onClick={() => setSelectedOption(idx)}
              >
                <span className="opt-letter-badge">{String.fromCharCode(65 + idx)}</span>
                <span className="opt-text-content">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Post-Submit Explanation & Citations */}
        {isSubmitted && (
          <div className={`quiz-feedback-editorial ${isCorrect ? 'is-verified' : 'is-error'}`}>
            <div className="feedback-status-head">
              {isCorrect ? (
                <>
                  <CheckCircle2 size={18} className="status-icon green" />
                  <span className="status-heading">Right</span>
                </>
              ) : (
                <>
                  <XCircle size={18} className="status-icon red" />
                  <span className="status-heading">Not quite. Here’s why:</span>
                </>
              )}
            </div>

            <p className="feedback-editorial-text">{quiz.explanation}</p>

            {/* "IN ONE LINE" Style Grounded Citation Box */}
            <div className="quiz-citation-tldr">
              <span className="citation-eyebrow">SOURCE</span>
              <div className="citation-title-row">
                <span className="citation-brand">{quiz.referenceSource.title}</span>
                <span className="citation-divider">&middot;</span>
                <span className="citation-section">{quiz.referenceSource.chapterOrSection}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="quiz-modal-footer">
          {!isSubmitted ? (
            <button
              className="quiz-primary-action-btn"
              disabled={selectedOption === null}
              onClick={handleSubmit}
            >
              Check my answer
            </button>
          ) : isCorrect ? (
            <button
              className="quiz-primary-action-btn unlock"
              onClick={() => {
                onPassedQuiz();
                onClose();
              }}
            >
              <span>Done</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button className="quiz-retry-action-btn" onClick={handleRetry}>
              <RotateCcw size={14} />
              <span>Try again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
