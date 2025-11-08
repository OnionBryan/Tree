/**
 * Phase 0: Text Question Component
 *
 * Free-form text response with validation, character counting, and sentiment analysis.
 * Features real-time validation, analytics tracking, and fuzzy logic mapping.
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
 * TextQuestion component props
 * @typedef {Object} TextQuestionProps
 * @property {import('../../../lib/phase0/types.js').TextQuestion} question - Question configuration
 * @property {string} value - Current response text
 * @property {Function} onChange - Change handler (newValue, analytics, fuzzyValue)
 * @property {boolean} [required=false] - Is question required
 * @property {boolean} [autoFocus=false] - Auto-focus on mount
 * @property {boolean} [disabled=false] - Disable input
 * @property {string} [className] - Additional CSS classes
 * @property {Function} [onBlur] - Blur event handler
 * @property {Function} [onFocus] - Focus event handler
 * @property {Array<{rule: string, params: Object}>} [customValidation] - Custom validation rules
 * @property {boolean} [enablePiping=false] - Enable variable piping in question text
 */

/**
 * Text Question Component
 *
 * @param {TextQuestionProps} props - Component props
 */
const TextQuestion = ({
  question,
  value = '',
  onChange,
  required = false,
  autoFocus = false,
  disabled = false,
  className = '',
  onBlur,
  onFocus,
  customValidation = [],
  enablePiping = false,
}) => {
  // Get piping engine from store
  const parseText = usePhase0Store((state) => state.parseText);
  const isQuestionRequired = usePhase0Store((state) => state.isQuestionRequired);
  // Analytics state
  const [analytics, setAnalytics] = useState({
    startTime: null,
    endTime: null,
    changeCount: 0,
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
  const [touched, setTouched] = useState(false);

  // Refs
  const textareaRef = useRef(null);
  const startTimeRef = useRef(null);

  // Extract question properties
  const {
    text: questionText,
    description,
    minLength = 0,
    maxLength = 5000,
    placeholder,
    pattern,
    multiline = true,
  } = question;

  /**
   * Validate response in real-time
   */
  const validateResponse = useCallback(() => {
    if (!touched && value.length === 0) {
      // Don't validate until user interacts
      return;
    }

    // Base validation
    const validationResult = ResponseValidator.validateTextResponse(
      value,
      question
    );

    // Apply custom validation rules if provided
    if (customValidation && customValidation.length > 0) {
      const customResult = ResponseValidator.validateWithCustomRules(
        value,
        customValidation
      );

      // Merge results
      validationResult.valid = validationResult.valid && customResult.valid;
      validationResult.errors.push(...customResult.errors);
      validationResult.warnings.push(...customResult.warnings);
      Object.assign(validationResult.metrics, customResult.metrics);
    }

    setValidation(validationResult);
  }, [value, question, touched, customValidation]);

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;

      // Update analytics
      setAnalytics((prev) => ({
        ...prev,
        changeCount: prev.changeCount + 1,
        startTime: prev.startTime || Date.now(),
      }));

      setTouched(true);

      // Map to fuzzy logic value
      const fuzzyValue = LogicMapper.mapTextResponse(newValue, question);

      // Update parent with value, analytics, and fuzzy mapping
      onChange(newValue, {
        ...analytics,
        changeCount: analytics.changeCount + 1,
      }, fuzzyValue);
    },
    [onChange, question, analytics]
  );

  /**
   * Handle focus event
   */
  const handleFocus = useCallback(
    (e) => {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      setAnalytics((prev) => ({
        ...prev,
        focusCount: prev.focusCount + 1,
        startTime: prev.startTime || Date.now(),
      }));

      if (onFocus) {
        onFocus(e);
      }
    },
    [onFocus]
  );

  /**
   * Handle blur event
   */
  const handleBlur = useCallback(
    (e) => {
      setTouched(true);

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

      if (onBlur) {
        onBlur(e);
      }
    },
    [onBlur]
  );

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
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, multiline]);

  /**
   * Parse question text with piping if enabled
   */
  const displayQuestionText = useMemo(() => {
    if (enablePiping && parseText) {
      return parseText(questionText);
    }
    return questionText;
  }, [enablePiping, parseText, questionText]);

  /**
   * Parse description with piping if enabled
   */
  const displayDescription = useMemo(() => {
    if (enablePiping && parseText && description) {
      return parseText(description);
    }
    return description;
  }, [enablePiping, parseText, description]);

  /**
   * Check if question is conditionally required
   */
  const isRequired = useMemo(() => {
    if (isQuestionRequired && question.id) {
      return isQuestionRequired(question.id, required);
    }
    return required;
  }, [isQuestionRequired, question.id, required]);

  /**
   * Determine if showing validation
   */
  const showValidation = touched || value.length > 0;

  /**
   * Input element (textarea or input)
   */
  const InputElement = multiline ? 'textarea' : 'input';

  /**
   * Input props
   */
  const inputProps = {
    ref: multiline ? textareaRef : null,
    value,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    disabled,
    required: isRequired,
    autoFocus,
    placeholder: placeholder || (multiline ? 'Type your response here...' : ''),
    maxLength: maxLength > 0 ? maxLength : undefined,
    pattern: pattern || undefined,
    className: `
      w-full
      px-phi-md py-phi-sm
      text-phase0-md
      bg-white dark:bg-gray-800
      border-2 rounded-lg
      transition-all duration-300 ease-natural
      ${
        validation.valid || !showValidation
          ? 'border-gray-300 dark:border-gray-600 focus:border-gsu-secondary'
          : 'border-color-error focus:border-color-error'
      }
      focus:outline-none focus:ring-2 focus:ring-opacity-50
      ${validation.valid || !showValidation ? 'focus:ring-gsu-secondary' : 'focus:ring-color-error'}
      disabled:opacity-50 disabled:cursor-not-allowed
      ${multiline ? 'min-h-[8rem] resize-none' : ''}
    `,
    'aria-invalid': !validation.valid && showValidation,
    'aria-describedby': showValidation
      ? `${question.id}-validation ${question.id}-count`
      : undefined,
  };

  return (
    <QuestionContainer
      label={displayQuestionText}
      description={displayDescription}
      required={isRequired}
      className={className}
    >
      {/* Input field */}
      <InputElement {...inputProps} />

      {/* Character count */}
      <div id={`${question.id}-count`} className="mt-phi-sm">
        <CharacterCount
          current={value.length}
          max={maxLength}
          min={minLength}
          warningThreshold={0.9}
          showProgress={maxLength > 0}
        />
      </div>

      {/* Validation messages */}
      {showValidation && (
        <div id={`${question.id}-validation`} className="mt-phi-sm space-y-phi-xs">
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
            value.length >= minLength &&
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
        <details className="mt-phi-sm text-phase0-xs text-color-neutral">
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
    </QuestionContainer>
  );
};

export default TextQuestion;
