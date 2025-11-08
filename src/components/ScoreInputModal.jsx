import React, { useState, useEffect } from 'react';
import './ScoreInputModal.css';

const ScoreInputModal = ({
  isOpen,
  node,
  currentScale,
  allowDecimals,
  onSubmit,
  onCancel
}) => {
  const [score, setScore] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    if (isOpen && node) {
      const midpoint = (currentScale.min + currentScale.max) / 2;
      setScore(midpoint);
      setSliderValue(midpoint);
    }
  }, [isOpen, node, currentScale]);

  if (!isOpen || !node) return null;

  const step = allowDecimals ? 0.1 : 1;
  const scaleRange = currentScale.max - currentScale.min;
  const scaleLabels = [];

  for (let i = currentScale.min; i <= currentScale.max; i += Math.ceil(scaleRange / 5)) {
    scaleLabels.push(i);
  }

  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);
    setScore(value);
  };

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setScore(value);
      setSliderValue(value);
    }
  };

  const handleSubmit = () => {
    onSubmit(node, score);
  };

  const getScaleDescription = () => {
    const range = currentScale.max - currentScale.min;
    if (currentScale.min < 0) {
      return `Bipolar Scale: ${currentScale.min} (Very Poor) to ${currentScale.max} (Industry Leader)`;
    }
    return `Scale: ${currentScale.min} to ${currentScale.max} (${range + 1} points)`;
  };

  return (
    <div className="score-modal-overlay">
      <div className="score-modal">
        <h2>{node.question}</h2>
        <p className="scale-description">{getScaleDescription()}</p>

        <div className="slider-container">
          <input
            type="range"
            min={currentScale.min}
            max={currentScale.max}
            step={step}
            value={sliderValue}
            onChange={handleSliderChange}
            className="score-slider"
          />
          <div className="scale-labels">
            {scaleLabels.map(label => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        <div className="score-display-large">
          {allowDecimals ? score.toFixed(1) : Math.round(score)}
        </div>

        <div className="input-container">
          <label>Or enter exact value:</label>
          <input
            type="number"
            min={currentScale.min}
            max={currentScale.max}
            step={step}
            value={score}
            onChange={handleInputChange}
            className="score-input"
          />
        </div>

        <div className="modal-buttons">
          <button onClick={onCancel} className="btn-cancel">Cancel</button>
          <button onClick={handleSubmit} className="btn-submit">Submit Score</button>
        </div>
      </div>
    </div>
  );
};

export default ScoreInputModal;
