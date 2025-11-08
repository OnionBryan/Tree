/**
 * Phase 0: Semantic Differential Component
 *
 * Bipolar adjective scale for measuring attitudes and relationships.
 * CRITICAL: Used for generating 20×20 GSU relationship matrices.
 *
 * Features:
 * - Enforces odd number of points (true midpoint)
 * - Supports participant selection (for relationship matrices)
 * - Maps to GSU 0-7 scale
 * - Shows polarity strength and direction
 * - Golden ratio spacing and smooth animations
 *
 * @component
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import QuestionContainer from '../shared/QuestionContainer.jsx';
import ValidationMessage from '../shared/ValidationMessage.jsx';
import { ResponseValidator } from '../../../lib/phase0/responseValidator.js';
import { LogicMapper } from '../../../lib/phase0/logicMapper.js';
import { GSU_MATRIX_SIZE } from '../../../lib/phase0/constants.js';

/**
 * SemanticDifferential component props
 * @typedef {Object} SemanticDifferentialProps
 * @property {import('../../../lib/phase0/types.js').SemanticDifferentialQuestion} question - Question configuration
 * @property {number|null} value - Current selected value (1 to points)
 * @property {Function} onChange - Change handler (newValue, analytics, fuzzyValue)
 * @property {boolean} [required=false] - Is question required
 * @property {boolean} [disabled=false] - Disable input
 * @property {string} [className] - Additional CSS classes
 * @property {number} [targetParticipant] - Target participant ID (for relationship matrices)
 * @property {Array<Object>} [participants] - List of participants (for selection)
 * @property {boolean} [showParticipantSelector=false] - Show participant selector
 * @property {Function} [onParticipantChange] - Participant selection handler
 */

/**
 * Semantic Differential Component
 *
 * @param {SemanticDifferentialProps} props - Component props
 */
const SemanticDifferential = ({
  question,
  value = null,
  onChange,
  required = false,
  disabled = false,
  className = '',
  targetParticipant = null,
  participants = [],
  showParticipantSelector = false,
  onParticipantChange,
}) => {
  // Analytics state
  const [analytics, setAnalytics] = useState({
    startTime: null,
    endTime: null,
    changeCount: 0,
    totalTimeMs: 0,
  });

  // Track if user has interacted
  const [touched, setTouched] = useState(false);

  // Extract question properties
  const {
    text: questionText,
    description,
    leftPole,
    rightPole,
    points = 7,
    showMidpointLabel = true,
    midpointLabel = 'Neutral',
  } = question;

  // Ensure odd number of points
  const actualPoints = points % 2 === 0 ? points + 1 : points;
  const midpoint = Math.ceil(actualPoints / 2);

  /**
   * Generate scale points
   */
  const scalePoints = useMemo(() => {
    const points = [];
    for (let i = 1; i <= actualPoints; i++) {
      points.push(i);
    }
    return points;
  }, [actualPoints]);

  /**
   * Calculate position metrics
   */
  const metrics = useMemo(() => {
    if (value === null) {
      return null;
    }

    return ResponseValidator.calculateSemanticMetrics(value, actualPoints);
  }, [value, actualPoints]);

  /**
   * Get fuzzy logic mapping
   */
  const fuzzyValue = useMemo(() => {
    if (value === null) {
      return null;
    }

    return LogicMapper.mapSemanticResponse(value, question);
  }, [value, question]);

  /**
   * Handle value change
   */
  const handleChange = useCallback(
    (newValue) => {
      setTouched(true);

      setAnalytics((prev) => ({
        ...prev,
        changeCount: prev.changeCount + 1,
        startTime: prev.startTime || Date.now(),
        endTime: Date.now(),
      }));

      // Calculate total time
      const totalTime =
        analytics.startTime !== null
          ? Date.now() - analytics.startTime
          : 0;

      const updatedAnalytics = {
        ...analytics,
        changeCount: analytics.changeCount + 1,
        totalTimeMs: totalTime,
        endTime: Date.now(),
      };

      // Get fuzzy mapping
      const fuzzy = LogicMapper.mapSemanticResponse(newValue, question);

      onChange(newValue, updatedAnalytics, fuzzy);
    },
    [onChange, question, analytics]
  );

  /**
   * Handle participant selection
   */
  const handleParticipantChange = useCallback(
    (e) => {
      const participantId = parseInt(e.target.value, 10);
      if (onParticipantChange) {
        onParticipantChange(participantId);
      }
    },
    [onParticipantChange]
  );

  /**
   * Validation
   */
  const validation = useMemo(() => {
    if (!touched || value === null) {
      return { valid: true, errors: [], warnings: [] };
    }

    // Basic validation
    const result = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Check if required
    if (required && value === null) {
      result.valid = false;
      result.errors.push('Please select a response');
    }

    // Check if participant is selected (for relationship matrices)
    if (showParticipantSelector && targetParticipant === null) {
      result.valid = false;
      result.errors.push('Please select a participant');
    }

    return result;
  }, [value, required, showParticipantSelector, targetParticipant, touched]);

  /**
   * Polarity color
   */
  const getPolarityColor = (pointValue) => {
    if (value === null) return 'bg-gray-200 dark:bg-gray-700';

    if (pointValue === value) {
      // Selected
      if (pointValue < midpoint) {
        // Left pole
        const intensity = (midpoint - pointValue) / (midpoint - 1);
        return `bg-blue-${Math.round(intensity * 600 + 400)}`;
      } else if (pointValue > midpoint) {
        // Right pole
        const intensity = (pointValue - midpoint) / (actualPoints - midpoint);
        return `bg-orange-${Math.round(intensity * 600 + 400)}`;
      } else {
        // Midpoint
        return 'bg-gray-400 dark:bg-gray-500';
      }
    }

    return 'bg-gray-200 dark:bg-gray-700';
  };

  /**
   * Get polarity indicator
   */
  const polarityIndicator = useMemo(() => {
    if (!metrics) return null;

    const { direction, polarityStrength } = metrics;

    let label = '';
    let color = '';

    if (polarityStrength < 0.2) {
      label = 'Neutral';
      color = 'text-gray-600 dark:text-gray-400';
    } else if (direction < 0) {
      label = `Strongly ${leftPole}`;
      color = 'text-blue-600 dark:text-blue-400';
    } else {
      label = `Strongly ${rightPole}`;
      color = 'text-orange-600 dark:text-orange-400';
    }

    return { label, color };
  }, [metrics, leftPole, rightPole]);

  return (
    <QuestionContainer
      label={questionText}
      description={description}
      required={required}
      className={className}
    >
      <div className="space-y-phi-lg">
        {/* Participant selector (for relationship matrices) */}
        {showParticipantSelector && (
          <div>
            <label
              htmlFor={`${question.id}-participant`}
              className="block text-phase0-sm font-medium text-gsu-dark dark:text-white mb-phi-sm"
            >
              Select Participant
            </label>
            <select
              id={`${question.id}-participant`}
              value={targetParticipant ?? ''}
              onChange={handleParticipantChange}
              disabled={disabled}
              required={required}
              className="w-full px-phi-md py-phi-sm text-phase0-md bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-gsu-secondary focus:outline-none focus:ring-2 focus:ring-gsu-secondary focus:ring-opacity-50 transition-all duration-300"
            >
              <option value="">-- Select a participant --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || `Participant ${p.id + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bipolar scale */}
        <div>
          {/* Pole labels */}
          <div className="flex justify-between items-center mb-phi-sm">
            <span className="text-phase0-md font-semibold text-blue-600 dark:text-blue-400">
              {leftPole}
            </span>
            {showMidpointLabel && (
              <span className="text-phase0-sm text-color-neutral">
                {midpointLabel}
              </span>
            )}
            <span className="text-phase0-md font-semibold text-orange-600 dark:text-orange-400">
              {rightPole}
            </span>
          </div>

          {/* Scale points */}
          <div className="flex items-center justify-between gap-phi-xs">
            {scalePoints.map((point) => (
              <label
                key={point}
                className="flex-1 cursor-pointer group"
              >
                <input
                  type="radio"
                  name={`${question.id}-scale`}
                  value={point}
                  checked={value === point}
                  onChange={() => handleChange(point)}
                  disabled={disabled}
                  required={required}
                  className="sr-only"
                />
                <div
                  className={`
                    flex flex-col items-center justify-center
                    p-phi-sm rounded-lg border-2
                    transition-all duration-300 ease-natural
                    ${
                      value === point
                        ? 'border-gsu-secondary shadow-lg scale-110 -translate-y-1'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gsu-secondary/50 hover:scale-105'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  style={{
                    backgroundColor:
                      value === point
                        ? point < midpoint
                          ? `rgb(37, 99, 235, ${
                              0.2 + ((midpoint - point) / (midpoint - 1)) * 0.6
                            })`
                          : point > midpoint
                          ? `rgb(249, 115, 22, ${
                              0.2 + ((point - midpoint) / (actualPoints - midpoint)) * 0.6
                            })`
                          : 'rgb(156, 163, 175, 0.3)'
                        : undefined,
                  }}
                >
                  {/* Point number */}
                  <span
                    className={`
                      text-phase0-md font-bold
                      ${value === point ? 'text-gsu-dark dark:text-white' : 'text-color-neutral'}
                    `}
                  >
                    {point}
                  </span>

                  {/* Midpoint label */}
                  {point === midpoint && showMidpointLabel && (
                    <span className="text-phase0-xs mt-phi-xs text-center text-color-neutral">
                      {midpointLabel}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Visual polarity indicator */}
          {value !== null && (
            <div className="mt-phi-md">
              <div className="flex items-center justify-between text-phase0-xs text-color-neutral mb-phi-xs">
                <span>Polarity</span>
                {polarityIndicator && (
                  <span className={`font-medium ${polarityIndicator.color}`}>
                    {polarityIndicator.label}
                  </span>
                )}
              </div>
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                {/* Left pole indicator */}
                {metrics && metrics.direction < 0 && (
                  <div
                    className="absolute left-0 h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${Math.abs(metrics.direction) * 50}%`,
                    }}
                  />
                )}
                {/* Right pole indicator */}
                {metrics && metrics.direction > 0 && (
                  <div
                    className="absolute right-0 h-full bg-orange-500 transition-all duration-300"
                    style={{
                      width: `${metrics.direction * 50}%`,
                    }}
                  />
                )}
                {/* Midpoint marker */}
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-400 dark:bg-gray-500" />
              </div>
            </div>
          )}
        </div>

        {/* Metrics display */}
        {metrics && fuzzyValue && (
          <div className="text-phase0-xs text-color-neutral space-y-phi-xs">
            <div className="flex items-center justify-between">
              <span>Position:</span>
              <span className="font-mono">
                {metrics.ratio.toFixed(3)} ({metrics.direction.toFixed(3)})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>GSU Value:</span>
              <span className="font-mono font-semibold text-gsu-secondary">
                {fuzzyValue.gsuValue.toFixed(2)} / 7.00
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Polarity Strength:</span>
              <span className="font-mono">
                {(metrics.polarityStrength * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Validation messages */}
        {touched && (
          <div className="space-y-phi-xs">
            {/* Errors */}
            {validation.errors.length > 0 && (
              <ValidationMessage type="error" messages={validation.errors} />
            )}

            {/* Success */}
            {validation.valid && value !== null && (
              <ValidationMessage
                type="success"
                messages={['Response recorded']}
                icon={true}
              />
            )}
          </div>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && fuzzyValue && (
          <details className="text-phase0-xs text-color-neutral">
            <summary className="cursor-pointer hover:text-gsu-secondary">
              Fuzzy Logic Mapping
            </summary>
            <pre className="mt-phi-xs p-phi-sm bg-gray-100 dark:bg-gray-900 rounded overflow-auto">
              {JSON.stringify(
                {
                  value,
                  fuzzyValue,
                  metrics,
                  analytics,
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </div>
    </QuestionContainer>
  );
};

export default SemanticDifferential;
