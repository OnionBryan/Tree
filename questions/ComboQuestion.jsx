/**
 * Phase 0: Combo Question Component
 *
 * Combines Likert scale (quantitative) with qualitative text response.
 * Validates consistency between scale and text sentiment.
 *
 * @component
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import QuestionContainer from '../shared/QuestionContainer.jsx';
import ValidationMessage from '../shared/ValidationMessage.jsx';
import CharacterCount from '../shared/CharacterCount.jsx';
import { ResponseValidator } from '../../../lib/phase0/responseValidator.js';
import { LogicMapper } from '../../../lib/phase0/logicMapper.js';
import { usePhase0Store } from '../../../store/phase0Store.js';

/**
 * ComboQuestion component props
 * @typedef {Object} ComboQuestionProps
 * @property {import('../../../lib/phase0/types.js').ComboQuestion} question - Question configuration
 * @property {Object} value - Current response { scale: number, text: string }
 * @property {Function} onChange - Change handler (newValue, analytics, fuzzyValue)
 * @property {boolean} [required=false] - Is question required
 * @property {boolean} [disabled=false] - Disable input
 * @property {string} [className] - Additional CSS classes
 * @property {Array<{rule: string, params: Object}>} [customValidation] - Custom validation rules
 * @property {boolean} [enablePiping=false] - Enable variable piping in question text
 */

/**
 * Combo Question Component
 *
 * @param {ComboQuestionProps} props - Component props
 */
const ComboQuestion = ({
  question,
  value = { scale: null, text: '' },
  onChange,
  required = false,
  disabled = false,
  className = '',
  customValidation = [],
  enablePiping = false,
}) => {
  // Get piping engine from store
  const parseText = usePhase0Store((state) => state.parseText);
  const isQuestionRequired = usePhase0Store((state) => state.isQuestionRequired);
  // Ensure value has correct shape
  const currentValue = {
    scale: value?.scale ?? null,
    text: value?.text ?? '',
  };

  // Analytics state
  const [analytics, setAnalytics] = useState({
    startTime: null,
    endTime: null,
    scaleChangeCount: 0,
    textChangeCount: 0,
    focusCount: 0,
    totalTimeMs: 0,
  });

  // Validation state
  const [validation, setValidation] = useState({
    valid: true,
    errors: [],
    warnings: [],
    metrics: {},
  });

  // Track if user has interacted
  const [touched, setTouched] = useState({
    scale: false,
    text: false,
  });

  // Refs
  const textareaRef = useRef(null);
  const startTimeRef = useRef(null);

  // Extract question properties
  const {
    text: questionText,
    description,
    quantitative,
    qualitative,
  } = question;

  const {
    text: scaleText,
    min: scaleMin = 1,
    max: scaleMax = 5,
    labels: scaleLabels = {},
  } = quantitative;

  const {
    text: textPrompt,
    minLength: textMinLength = 0,
    maxLength: textMaxLength = 1000,
    placeholder: textPlaceholder,
  } = qualitative;

  /**
   * Validate response in real-time
   */
  const validateResponse = useCallback(() => {
    if (!touched.scale && !touched.text) {
      return;
    }

    const validationResult = ResponseValidator.validateComboResponse(
      currentValue,
      question
    );

    setValidation(validationResult);
  }, [currentValue, question, touched]);

  /**
   * Handle scale change
   */
  const handleScaleChange = useCallback(
    (e) => {
      const newScale = parseInt(e.target.value, 10);

      const newValue = {
        ...currentValue,
        scale: newScale,
      };

      setTouched((prev) => ({ ...prev, scale: true }));

      setAnalytics((prev) => ({
        ...prev,
        scaleChangeCount: prev.scaleChangeCount + 1,
        startTime: prev.startTime || Date.now(),
      }));

      // Map to fuzzy logic value
      const fuzzyValue = LogicMapper.mapComboResponse(newValue, question);

      onChange(newValue, {
        ...analytics,
        scaleChangeCount: analytics.scaleChangeCount + 1,
      }, fuzzyValue);
    },
    [currentValue, onChange, question, analytics]
  );

  /**
   * Handle text change
   */
  const handleTextChange = useCallback(
    (e) => {
      const newText = e.target.value;

      const newValue = {
        ...currentValue,
        text: newText,
      };

      setTouched((prev) => ({ ...prev, text: true }));

      setAnalytics((prev) => ({
        ...prev,
        textChangeCount: prev.textChangeCount + 1,
        startTime: prev.startTime || Date.now(),
      }));

      // Map to fuzzy logic value
      const fuzzyValue = LogicMapper.mapComboResponse(newValue, question);

      onChange(newValue, {
        ...analytics,
        textChangeCount: analytics.textChangeCount + 1,
      }, fuzzyValue);
    },
    [currentValue, onChange, question, analytics]
  );

  /**
   * Handle focus event
   */
  const handleFocus = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    setAnalytics((prev) => ({
      ...prev,
      focusCount: prev.focusCount + 1,
      startTime: prev.startTime || Date.now(),
    }));
  }, []);

  /**
   * Handle blur event
   */
  const handleBlur = useCallback(() => {
    if (startTimeRef.current) {
      const endTime = Date.now();
      const totalTime = endTime - startTimeRef.current;

      setAnalytics((prev) => ({
        ...prev,
        endTime,
        totalTimeMs: prev.totalTimeMs + totalTime,
      }));

      startTimeRef.current = null;
    }
  }, []);

  /**
   * Validate on value change
   */
  useEffect(() => {
    validateResponse();
  }, [validateResponse]);

  /**
   * Auto-resize textarea
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentValue.text]);

  /**
   * Generate scale options
   */
  const scaleOptions = [];
  for (let i = scaleMin; i <= scaleMax; i++) {
    scaleOptions.push(i);
  }

  /**
   * Determine if showing validation
   */
  const showValidation = touched.scale || touched.text;

  /**
   * Consistency indicator color
   */
  const consistencyColor =
    validation.metrics.consistency !== undefined
      ? validation.metrics.consistency >= 0.7
        ? 'text-color-valid'
        : validation.metrics.consistency >= 0.4
        ? 'text-color-warning'
        : 'text-color-error'
      : 'text-color-neutral';

  return (
    <QuestionContainer
      label={questionText}
      description={description}
      required={required}
      className={className}
    >
      <div className="space-y-phi-lg">
        {/* Quantitative scale */}
        <div>
          <label className="block text-phase0-sm font-medium text-gsu-dark dark:text-white mb-phi-sm">
            {scaleText}
          </label>

          {/* Scale options */}
          <div className="flex items-center justify-between gap-phi-xs">
            {scaleOptions.map((value) => (
              <label
                key={value}
                className="flex-1 cursor-pointer group"
              >
                <input
                  type="radio"
                  name={`${question.id}-scale`}
                  value={value}
                  checked={currentValue.scale === value}
                  onChange={handleScaleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
                      currentValue.scale === value
                        ? 'border-gsu-secondary bg-gsu-secondary text-white shadow-md scale-105'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gsu-dark dark:text-white hover:border-gsu-secondary/50 hover:shadow-sm'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-phase0-lg font-bold">{value}</span>
                  {scaleLabels[value] && (
                    <span className="text-phase0-xs mt-phi-xs text-center">
                      {scaleLabels[value]}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Scale endpoints */}
          <div className="flex justify-between mt-phi-xs text-phase0-xs text-color-neutral">
            <span>{scaleLabels[scaleMin] || scaleMin}</span>
            <span>{scaleLabels[scaleMax] || scaleMax}</span>
          </div>
        </div>

        {/* Qualitative text */}
        <div>
          <label
            htmlFor={`${question.id}-text`}
            className="block text-phase0-sm font-medium text-gsu-dark dark:text-white mb-phi-sm"
          >
            {textPrompt}
          </label>

          <textarea
            ref={textareaRef}
            id={`${question.id}-text`}
            value={currentValue.text}
            onChange={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={textPlaceholder || 'Please explain your rating...'}
            maxLength={textMaxLength > 0 ? textMaxLength : undefined}
            className={`
              w-full
              px-phi-md py-phi-sm
              text-phase0-md
              bg-white dark:bg-gray-800
              border-2 rounded-lg
              transition-all duration-300 ease-natural
              min-h-[6rem] resize-none
              ${
                validation.valid || !showValidation
                  ? 'border-gray-300 dark:border-gray-600 focus:border-gsu-secondary'
                  : 'border-color-error focus:border-color-error'
              }
              focus:outline-none focus:ring-2 focus:ring-opacity-50
              ${validation.valid || !showValidation ? 'focus:ring-gsu-secondary' : 'focus:ring-color-error'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-invalid={!validation.valid && showValidation}
            aria-describedby={
              showValidation
                ? `${question.id}-validation ${question.id}-count`
                : undefined
            }
          />

          {/* Character count */}
          <div id={`${question.id}-count`} className="mt-phi-sm">
            <CharacterCount
              current={currentValue.text.length}
              max={textMaxLength}
              min={textMinLength}
              warningThreshold={0.9}
              showProgress={textMaxLength > 0}
            />
          </div>
        </div>

        {/* Consistency indicator */}
        {touched.scale && touched.text && validation.metrics.consistency !== undefined && (
          <div className="flex items-center gap-phi-sm text-phase0-sm">
            <span className="text-color-neutral">Consistency:</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  validation.metrics.consistency >= 0.7
                    ? 'bg-color-valid'
                    : validation.metrics.consistency >= 0.4
                    ? 'bg-color-warning'
                    : 'bg-color-error'
                }`}
                style={{ width: `${validation.metrics.consistency * 100}%` }}
              />
            </div>
            <span className={`font-medium ${consistencyColor}`}>
              {Math.round(validation.metrics.consistency * 100)}%
            </span>
          </div>
        )}

        {/* Validation messages */}
        {showValidation && (
          <div id={`${question.id}-validation`} className="space-y-phi-xs">
            {/* Errors */}
            {validation.errors.length > 0 && (
              <ValidationMessage type="error" messages={validation.errors} />
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <ValidationMessage type="warning" messages={validation.warnings} />
            )}

            {/* Success state */}
            {validation.valid &&
              currentValue.scale !== null &&
              currentValue.text.length >= textMinLength &&
              validation.warnings.length === 0 && (
                <ValidationMessage
                  type="success"
                  messages={['Response looks good!']}
                  icon={true}
                />
              )}
          </div>
        )}

        {/* Metrics display (optional, for debugging) */}
        {process.env.NODE_ENV === 'development' && validation.metrics && (
          <details className="text-phase0-xs text-color-neutral">
            <summary className="cursor-pointer hover:text-gsu-secondary">
              Validation Metrics
            </summary>
            <pre className="mt-phi-xs p-phi-sm bg-gray-100 dark:bg-gray-900 rounded overflow-auto">
              {JSON.stringify(
                {
                  ...validation.metrics,
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

export default ComboQuestion;
