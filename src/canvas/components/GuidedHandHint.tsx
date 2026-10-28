import React, { useEffect, useState } from 'react';
import { Sparkles, Play, CheckCircle2, X, ChevronRight, CornerDownRight } from 'lucide-react';
import { SolutionStep, ActSolutionPlan } from '../data/actSolutions';
import { CanvasNode, CanvasWire } from '../types';

interface GuidedHandHintProps {
  plan: ActSolutionPlan;
  mode: 'hint' | 'autosolve';
  zoom: number;
  pan: { x: number; y: number };
  onClose: () => void;
  onApplyStep: (step: SolutionStep) => void;
  onApplyFullSolution: (solvedNodes?: CanvasNode[], solvedWires?: CanvasWire[]) => void;
}

export const GuidedHandHint: React.FC<GuidedHandHintProps> = ({
  plan,
  mode,
  zoom,
  pan,
  onClose,
  onApplyStep,
  onApplyFullSolution
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [handPos, setHandPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const steps = plan.steps;
  const currentStep = steps[currentStepIdx] || steps[0];

  // Convert canvas coordinates to screen coordinates
  const toScreen = (coords: { x: number; y: number }) => ({
    x: coords.x * zoom + pan.x,
    y: coords.y * zoom + pan.y
  });

  // Handle step animation
  useEffect(() => {
    if (!currentStep) return;

    const startPos = toScreen(currentStep.sourceCoords);
    setHandPos(startPos);
    setIsClicking(false);

    // If it's a drag or click, animate
    const clickTimer = setTimeout(() => {
      setIsClicking(true);

      if (currentStep.actionType === 'drag_wire' && currentStep.targetCoords) {
        const targetPos = toScreen(currentStep.targetCoords);
        // Animate moving to target
        const dragTimer = setTimeout(() => {
          setHandPos(targetPos);
          setIsClicking(false);
        }, 600);

        return () => clearTimeout(dragTimer);
      }
    }, 400);

    return () => clearTimeout(clickTimer);
  }, [currentStepIdx, zoom, pan, currentStep]);

  // If in auto-solve mode, automatically proceed through steps
  useEffect(() => {
    if (mode !== 'autosolve') return;

    if (currentStepIdx < steps.length) {
      const stepTimer = setTimeout(() => {
        onApplyStep(steps[currentStepIdx]);
        if (currentStepIdx + 1 < steps.length) {
          setCurrentStepIdx((prev) => prev + 1);
        } else {
          // Finished auto-solve
          setIsDone(true);
          if (plan.solvedWires || plan.solvedNodes) {
            onApplyFullSolution(plan.solvedNodes, plan.solvedWires);
          }
          const closeTimer = setTimeout(() => {
            onClose();
          }, 1800);
          return () => clearTimeout(closeTimer);
        }
      }, 1500);

      return () => clearTimeout(stepTimer);
    }
  }, [mode, currentStepIdx, steps, onApplyStep, plan, onApplyFullSolution, onClose]);

  const handleNextStep = () => {
    onApplyStep(currentStep);
    if (currentStepIdx + 1 < steps.length) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      setIsDone(true);
      if (plan.solvedWires || plan.solvedNodes) {
        onApplyFullSolution(plan.solvedNodes, plan.solvedWires);
      }
      setTimeout(() => onClose(), 1200);
    }
  };

  const handleRunFullAutoSolve = () => {
    if (plan.solvedWires || plan.solvedNodes) {
      onApplyFullSolution(plan.solvedNodes, plan.solvedWires);
    }
    setIsDone(true);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="guided-hand-overlay">
      {/* 1. GUIDED MOTION TRAIL (SVG) */}
      {currentStep && currentStep.targetCoords && (
        <svg className="guided-trail-svg">
          <defs>
            <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path
            d={`M ${toScreen(currentStep.sourceCoords).x} ${toScreen(currentStep.sourceCoords).y}
               Q ${(toScreen(currentStep.sourceCoords).x + toScreen(currentStep.targetCoords).x) / 2}
                 ${Math.min(toScreen(currentStep.sourceCoords).y, toScreen(currentStep.targetCoords).y) - 40}
                 ${toScreen(currentStep.targetCoords).x} ${toScreen(currentStep.targetCoords).y}`}
            fill="none"
            stroke="url(#trailGrad)"
            strokeWidth="3"
            strokeDasharray="6 6"
            className="guided-dash-path"
          />
        </svg>
      )}

      {/* 2. THE HAND CURSOR & SPEECH BUBBLE */}
      <div
        className="guided-hand-actor"
        style={{
          transform: `translate3d(${handPos.x}px, ${handPos.y}px, 0)`
        }}
      >
        {/* Pulsing Ripple When Clicking */}
        {isClicking && <div className="hand-click-ripple" />}

        {/* Hand SVG Icon */}
        <div className={`hand-svg-wrapper ${isClicking ? 'clicking' : ''}`}>
          <svg width="42" height="42" viewBox="0 0 24 24" className="hand-svg">
            <defs>
              <filter id="hand-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.5" />
              </filter>
            </defs>
            <path
              d="M10 2a2 2 0 0 0-2 2v7.5l-1.5-1.5a1.5 1.5 0 0 0-2.12 2.12l4.24 4.24c1.17 1.17 2.76 1.84 4.42 1.84h3.96a5 5 0 0 0 4.9-4l.8-4.8a2 2 0 0 0-1.97-2.33h-4.33V4a2 2 0 0 0-2-2h-4.4z"
              fill="#38bdf8"
              stroke="#e0f2fe"
              strokeWidth="1.2"
              filter="url(#hand-shadow)"
            />
          </svg>
        </div>

        {/* Speech Bubble / Instruction Card */}
        <div className="hand-speech-card">
          <div className="speech-header">
            <div className="speech-title">
              <Sparkles size={12} className="sparkle-cyan" />
              <span>
                {isDone
                  ? 'All Done!'
                  : mode === 'autosolve'
                  ? `Auto-Solving (${currentStepIdx + 1}/${steps.length})`
                  : `Hint: Step ${currentStepIdx + 1} of ${steps.length}`}
              </span>
            </div>
            <button className="speech-close-btn" onClick={onClose} title="Close guide">
              <X size={12} />
            </button>
          </div>

          <p className="speech-instruction">
            {isDone ? 'Architectural pattern successfully connected and validated.' : currentStep.instruction}
          </p>

          <div className="speech-actions">
            {!isDone && (
              <>
                <button className="speech-next-btn" onClick={handleNextStep}>
                  <span>{currentStepIdx + 1 === steps.length ? 'Apply & Complete' : 'Next Step'}</span>
                  <ChevronRight size={13} />
                </button>
                <button className="speech-solve-btn" onClick={handleRunFullAutoSolve} title="Apply full solution immediately">
                  <Play size={10} />
                  <span>Auto-Solve All</span>
                </button>
              </>
            )}
            {isDone && (
              <div className="speech-success-pill">
                <CheckCircle2 size={13} />
                <span>Pattern verified against {plan.citation}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
