// ============================================
// Mathematical Constants and Functions
// ============================================

const PHI = 1.618033988749894; // Golden ratio for UI proportions
const EULER = 2.718281828459045; // For exponential weighting

/**
 * Calculate true mathematical midpoint for odd-numbered scales
 * @param {number} points - Number of scale points
 * @returns {number} Zero-indexed midpoint
 */
function calculateMidpoint(points) {
    if (points % 2 === 0) {
        throw new Error('Semantic differential requires odd number of points for true neutral');
    }
    return Math.floor(points / 2);
}

/**
 * Calculate visual position on semantic differential scale
 * Using logarithmic spacing for psychological accuracy
 * @param {number} value - Selected value (1-indexed)
 * @param {number} total - Total number of points
 * @returns {number} Position percentage (0-100)
 */
function calculateSemanticPosition(value, total) {
    // Convert to 0-indexed
    const zeroIndexed = value - 1;
    const midpoint = calculateMidpoint(total);

    if (zeroIndexed === midpoint) {
        return 50; // Exact center
    }

    // Use logarithmic scaling for psychological distance
    // Points feel further apart near extremes
    const distance = zeroIndexed - midpoint;
    const maxDistance = midpoint;

    // Apply sigmoid transformation for perceptual linearity
    const normalized = distance / maxDistance;
    const sigmoid = 1 / (1 + Math.exp(-normalized * 3));

    return sigmoid * 100;
}

// ============================================
// Question Factory with Validation
// ============================================

class QuestionFactory {
    /**
     * Generate cryptographically secure UUID v4
     * @returns {string} UUID
     */
    static generateId() {
        // Proper UUID v4 generation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Create text question with full validation
     * @param {Object} params - Question parameters
     * @returns {TextQuestion} Validated text question
     */
    static createTextQuestion(params) {
        const defaults = {
            minLength: 0,
            maxLength: 5000,
            placeholder: 'Please enter your response...',
            inputType: 'long',
            richText: false,
            validationPattern: null,
            validationMessage: 'Please provide a valid response',
            linguisticAnalysis: {
                sentiment: true,
                entities: true,
                keywords: true,
                emotion: false,
                concepts: false
            }
        };

        const question = {
            id: this.generateId(),
            type: 'text',
            order: params.order ?? 0,
            required: params.required ?? false,
            metadata: {
                created: new Date().toISOString(),
                version: 1,
                creator: params.creator || 'system'
            },
            analytics: {
                startTime: null,
                endTime: null,
                changeCount: 0,
                totalTime: 0
            },
            ...defaults,
            ...params
        };

        // Validation
        if (question.minLength < 0) {
            throw new Error('Minimum length cannot be negative');
        }
        if (question.maxLength < question.minLength) {
            throw new Error('Maximum length must be greater than minimum length');
        }
        if (question.validationPattern && !(question.validationPattern instanceof RegExp)) {
            question.validationPattern = new RegExp(question.validationPattern);
        }

        return question;
    }

    /**
     * Create combination question with correlation tracking
     * @param {Object} params - Question parameters
     * @returns {ComboQuestion} Validated combo question
     */
    static createComboQuestion(params) {
        const question = {
            id: this.generateId(),
            type: 'combo',
            order: params.order ?? 0,
            required: params.required ?? false,
            metadata: {
                created: new Date().toISOString(),
                version: 1,
                creator: params.creator || 'system'
            },
            quantitative: {
                text: params.scaleText,
                scale: params.scale || 'agreement',
                points: params.points || 7,
                labels: params.labels || {}
            },
            qualitative: {
                prompt: params.textPrompt || 'Please explain your rating:',
                minLength: params.minLength || 0,
                maxLength: params.maxLength || 1000,
                placeholder: params.placeholder || 'Your explanation...'
            },
            logic: {
                showTextWhen: params.showTextWhen || 'always', // 'always', 'low', 'high', 'extreme'
                threshold: params.threshold || 3, // For 'low' or 'high' conditions
                correlationExpected: params.correlationExpected || 0.7 // Expected correlation
            },
            analytics: {
                quantitativeTime: 0,
                qualitativeTime: 0,
                consistency: null // Calculated post-response
            }
        };

        // Validate logic rules
        const validShowConditions = ['always', 'low', 'high', 'extreme', 'custom'];
        if (!validShowConditions.includes(question.logic.showTextWhen)) {
            throw new Error(`Invalid show condition: ${question.logic.showTextWhen}`);
        }

        return question;
    }

    /**
     * Create multiple choice question
     * @param {Object} params - Question parameters
     * @returns {Object} Validated multiple choice question
     */
    static createMultipleChoiceQuestion(params) {
        const question = {
            id: this.generateId(),
            type: 'multiple-choice',
            text: params.text,
            order: params.order ?? 0,
            required: params.required ?? false,
            metadata: {
                created: new Date().toISOString(),
                version: 1,
                creator: params.creator || 'system'
            },
            options: params.options || [],
            hasOther: params.hasOther ?? false,
            hasNone: params.hasNone ?? false,
            randomizeOptions: params.randomizeOptions ?? false,
            analytics: {
                startTime: null,
                endTime: null,
                changeCount: 0,
                selectedOption: null
            }
        };

        // Validation
        if (!question.text || question.text.length < 1) {
            throw new Error('Question text is required');
        }
        if (!Array.isArray(question.options) || question.options.length < 2) {
            throw new Error('At least 2 options are required');
        }

        return question;
    }

    /**
     * Create checkbox/multiple select question
     * @param {Object} params - Question parameters
     * @returns {Object} Validated checkbox question
     */
    static createCheckboxQuestion(params) {
        const question = {
            id: this.generateId(),
            type: 'checkbox',
            text: params.text,
            order: params.order ?? 0,
            required: params.required ?? false,
            metadata: {
                created: new Date().toISOString(),
                version: 1,
                creator: params.creator || 'system'
            },
            options: params.options || [],
            minSelections: params.minSelections ?? 0,
            maxSelections: params.maxSelections ?? 0, // 0 = unlimited
            hasOther: params.hasOther ?? false,
            hasNone: params.hasNone ?? false,
            hasSelectAll: params.hasSelectAll ?? false,
            randomizeOptions: params.randomizeOptions ?? false,
            analytics: {
                startTime: null,
                endTime: null,
                changeCount: 0,
                selectedOptions: []
            }
        };

        // Validation
        if (!question.text || question.text.length < 1) {
            throw new Error('Question text is required');
        }
        if (!Array.isArray(question.options) || question.options.length < 2) {
            throw new Error('At least 2 options are required');
        }
        if (question.minSelections < 0) {
            throw new Error('Minimum selections cannot be negative');
        }
        if (question.maxSelections > 0 && question.maxSelections < question.minSelections) {
            throw new Error('Maximum selections must be greater than minimum');
        }
        if (question.minSelections > question.options.length) {
            throw new Error('Minimum selections cannot exceed number of options');
        }

        return question;
    }

    /**
     * Create semantic differential with psychometric properties
     * @param {Object} params - Question parameters
     * @returns {SemanticDifferentialQuestion} Validated semantic differential
     */
    static createSemanticDifferential(params) {
        // Enforce odd number for true midpoint
        let points = params.points || 7;
        if (points % 2 === 0) {
            console.warn(`Semantic differential requires odd points. Adjusting ${points} to ${points + 1}`);
            points += 1;
        }

        const midpoint = calculateMidpoint(points);

        const question = {
            id: this.generateId(),
            type: 'semantic',
            order: params.order ?? 0,
            required: params.required ?? false,
            metadata: {
                created: new Date().toISOString(),
                version: 1,
                creator: params.creator || 'system'
            },
            leftPole: params.leftPole,
            rightPole: params.rightPole,
            points: points,
            midpoint: midpoint,
            showValues: params.showValues ?? false,
            showLabels: params.showLabels ?? true,
            visualStyle: params.visualStyle || 'continuous', // 'continuous', 'discrete', 'slider'
            psychometric: {
                construct: params.construct || null, // What this measures
                reliability: params.reliability || null, // Cronbach's alpha
                validity: params.validity || null, // Convergent/discriminant
                citations: params.citations || []
            },
            analytics: {
                startTime: null,
                endTime: null,
                hoverPath: [], // Track consideration process
                finalValue: null
            }
        };

        // Validate poles are different
        if (question.leftPole === question.rightPole) {
            throw new Error('Semantic differential poles must be different');
        }

        // Validate poles are meaningful opposites (basic check)
        if (question.leftPole.length < 2 || question.rightPole.length < 2) {
            throw new Error('Poles must be meaningful descriptors');
        }

        return question;
    }

    /**
     * Create a matrix grid question
     * @param {Object} params - Matrix question parameters
     * @returns {MatrixQuestion}
     */
    static createMatrixQuestion(params) {
        const question = {
            id: params.id || this.generateId(),
            type: 'matrix',
            text: params.text || '',
            rows: params.rows || [],
            columns: params.columns || [],
            responseType: params.responseType || 'radio', // 'radio', 'checkbox', 'dropdown'
            required: params.required || false,
            randomizeRows: params.randomizeRows || false,
            randomizeColumns: params.randomizeColumns || false,
            order: params.order || 0,
            metadata: {
                createdAt: new Date().toISOString(),
                version: '1.0'
            },
            responses: {}
        };

        // Validate minimum requirements
        if (question.rows.length < 2) {
            throw new Error('Matrix must have at least 2 rows');
        }
        if (question.columns.length < 2) {
            throw new Error('Matrix must have at least 2 columns');
        }

        // Initialize response structure
        question.rows.forEach(row => {
            question.responses[row] = question.responseType === 'checkbox' ? [] : null;
        });

        return question;
    }

    /**
     * Create a slider/visual analog scale question
     * @param {Object} params - Slider question parameters
     * @returns {SliderQuestion}
     */
    static createSliderQuestion(params) {
        const question = {
            id: params.id || this.generateId(),
            type: 'slider',
            text: params.text || '',
            min: params.min !== undefined ? params.min : 0,
            max: params.max !== undefined ? params.max : 100,
            step: params.step !== undefined ? params.step : 1,
            defaultValue: params.defaultValue !== undefined ? params.defaultValue : null,
            leftLabel: params.leftLabel || '',
            rightLabel: params.rightLabel || '',
            centerLabel: params.centerLabel || '',
            showValue: params.showValue !== undefined ? params.showValue : true,
            showTicks: params.showTicks || false,
            tickInterval: params.tickInterval || 10,
            required: params.required || false,
            order: params.order || 0,
            metadata: {
                createdAt: new Date().toISOString(),
                version: '1.0',
                visualType: params.visualType || 'standard', // 'standard', 'gradient', 'emoji'
                precision: params.step < 1 ? Math.abs(Math.floor(Math.log10(params.step))) : 0
            },
            response: {
                value: null,
                timeToFirstInteraction: null,
                numberOfAdjustments: 0,
                finalValue: null
            }
        };

        // Validate range
        if (question.min >= question.max) {
            throw new Error('Slider max must be greater than min');
        }

        // Validate step
        if (question.step <= 0) {
            throw new Error('Slider step must be positive');
        }

        // Set default value if not provided
        if (question.defaultValue === null) {
            question.defaultValue = (question.min + question.max) / 2;
        }

        // Validate default is within range
        if (question.defaultValue < question.min || question.defaultValue > question.max) {
            throw new Error('Default value must be within min-max range');
        }

        return question;
    }
}

// ============================================
// Response Validators
// ============================================

class ResponseValidator {
    /**
     * Validate text response with comprehensive checks
     * @param {string} response - User's response
     * @param {TextQuestion} question - Question configuration
     * @returns {Object} Validation result
     */
    static validateTextResponse(response, question) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            metrics: {}
        };

        // Null check
        if (question.required && (!response || response.trim().length === 0)) {
            result.valid = false;
            result.errors.push('Response is required');
            return result;
        }

        if (!response) {
            return result; // Valid if not required and empty
        }

        // Length validation
        const trimmedLength = response.trim().length;
        result.metrics.length = trimmedLength;

        if (trimmedLength < question.minLength) {
            result.valid = false;
            result.errors.push(`Response must be at least ${question.minLength} characters`);
        }

        if (trimmedLength > question.maxLength) {
            result.valid = false;
            result.errors.push(`Response must not exceed ${question.maxLength} characters`);
        }

        // Pattern validation
        if (question.validationPattern) {
            if (!question.validationPattern.test(response)) {
                result.valid = false;
                result.errors.push(question.validationMessage);
            }
        }

        // Quality checks (warnings, not errors)
        const words = response.split(/\s+/).filter(w => w.length > 0);
        result.metrics.wordCount = words.length;

        if (words.length < 3 && question.inputType === 'long') {
            result.warnings.push('Response seems very brief');
        }

        // Check for potential straight-lining or low effort
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        result.metrics.uniqueWords = uniqueWords.size;
        result.metrics.lexicalDiversity = uniqueWords.size / words.length;

        if (result.metrics.lexicalDiversity < 0.3 && words.length > 10) {
            result.warnings.push('Response shows low lexical diversity');
        }

        // Check for suspicious patterns (all caps, repeated characters)
        if (response === response.toUpperCase() && response.length > 10) {
            result.warnings.push('Response is in all capitals');
        }

        const repeatedChars = /(.)\1{4,}/g;
        if (repeatedChars.test(response)) {
            result.warnings.push('Response contains repeated characters');
        }

        return result;
    }

    /**
     * Validate combo response consistency
     * @param {Object} response - Combined response
     * @param {ComboQuestion} question - Question configuration
     * @returns {Object} Validation result with consistency score
     */
    static validateComboResponse(response, question) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            consistency: null
        };

        // Validate quantitative part
        if (question.required && response.scale === undefined) {
            result.valid = false;
            result.errors.push('Scale rating is required');
        }

        // Validate qualitative part based on logic
        const shouldShowText = this.evaluateTextCondition(
            response.scale,
            question.logic.showTextWhen,
            question.logic.threshold
        );

        if (shouldShowText && question.required && !response.text) {
            result.valid = false;
            result.errors.push('Explanation is required for this rating');
        }

        // Calculate consistency between scale and text sentiment
        if (response.scale !== undefined && response.text) {
            result.consistency = this.calculateConsistency(response.scale, response.text);

            if (result.consistency < 0.3) {
                result.warnings.push('Rating and explanation seem inconsistent');
            }
        }

        return result;
    }

    /**
     * Calculate consistency between quantitative and qualitative responses
     * Using ratio scale with true zero for mathematical validity
     * @param {number} scaleValue - Numeric rating (e.g., 1-7)
     * @param {string} text - Text explanation
     * @param {number} scaleMin - Minimum scale value (default: 1)
     * @param {number} scaleMax - Maximum scale value (default: 7)
     * @returns {number} Consistency score (0-1) where 0 is true zero (complete inconsistency)
     */
    static calculateConsistency(scaleValue, text, scaleMin = 1, scaleMax = 7) {
        // Convert to ratio scale with true zero
        // Scale position as ratio: 0 = minimum, 1 = maximum
        const scaleRatio = (scaleValue - scaleMin) / (scaleMax - scaleMin);

        // Text sentiment analysis (simplified - production should use vector service)
        const positiveWords = /good|great|excellent|satisfied|happy|pleased|wonderful|love|amazing|perfect/gi;
        const negativeWords = /bad|poor|terrible|unsatisfied|unhappy|disappointed|awful|hate|horrible|worst/gi;
        const neutralWords = /okay|fine|acceptable|adequate|moderate|average|neither/gi;

        const positiveMatches = (text.match(positiveWords) || []).length;
        const negativeMatches = (text.match(negativeWords) || []).length;
        const neutralMatches = (text.match(neutralWords) || []).length;

        const totalWords = text.split(/\s+/).length;
        const sentimentWords = positiveMatches + negativeMatches + neutralMatches;

        // Calculate text sentiment as ratio (0 = most negative, 1 = most positive)
        let textRatio;

        if (sentimentWords === 0) {
            // No sentiment words - assume neutral (0.5)
            textRatio = 0.5;
        } else {
            // Weight neutral as 0.5 contribution
            const sentimentScore = positiveMatches + (neutralMatches * 0.5);
            textRatio = sentimentScore / sentimentWords;
        }

        // Calculate absolute difference between ratios
        // Both are now on 0-1 scale with true zero
        const difference = Math.abs(scaleRatio - textRatio);

        // Consistency is inverse of difference
        // 0 = completely inconsistent (max difference of 1)
        // 1 = perfectly consistent (difference of 0)
        const consistency = 1 - difference;

        // Add confidence factor based on text length
        // Short texts have less reliable sentiment
        const minWordsForConfidence = 10;
        const confidenceFactor = Math.min(1, totalWords / minWordsForConfidence);

        // Adjust consistency by confidence
        // If text is too short, we can't be sure about inconsistency
        const adjustedConsistency = consistency * confidenceFactor + (1 - confidenceFactor) * 0.5;

        return adjustedConsistency;
    }

    /**
     * Calculate semantic differential position with true zero
     * @param {number} value - Selected value (1-indexed)
     * @param {number} total - Total number of points
     * @returns {Object} Position metrics with true zero reference
     */
    static calculateSemanticMetrics(value, total) {
        const midpoint = calculateMidpoint(total);

        // Convert to ratio scale (0 to 1)
        const ratio = (value - 1) / (total - 1);

        // Distance from midpoint (negative = left, positive = right, 0 = center)
        const centerOffset = (value - 1 - midpoint) / midpoint;

        // Polarity strength (0 = neutral, 1 = extreme)
        const polarityStrength = Math.abs(centerOffset);

        // Direction (-1 = full left, 0 = center, 1 = full right)
        const direction = centerOffset;

        return {
            ratio,              // 0-1 scale position
            centerOffset,       // -1 to 1 from center
            polarityStrength,   // 0-1 strength
            direction,          // -1 to 1 direction
            percentile: ratio * 100  // 0-100 percentile
        };
    }

    /**
     * Evaluate whether to show text field based on conditions
     * @param {number} scaleValue - Selected scale value
     * @param {string} condition - Show condition
     * @param {number} threshold - Threshold value
     * @returns {boolean} Whether to show text field
     */
    static evaluateTextCondition(scaleValue, condition, threshold) {
        switch (condition) {
            case 'always':
                return true;
            case 'low':
                return scaleValue <= threshold;
            case 'high':
                return scaleValue >= threshold;
            case 'extreme':
                return scaleValue === 1 || scaleValue === 7;
            default:
                return true;
        }
    }

    /**
     * Validate semantic differential response
     * @param {number} value - Selected value
     * @param {SemanticDifferentialQuestion} question - Question configuration
     * @returns {Object} Validation result
     */
    static validateSemanticResponse(value, question) {
        const result = {
            valid: true,
            errors: [],
            metrics: {}
        };

        if (question.required && value === undefined) {
            result.valid = false;
            result.errors.push('Please select a position on the scale');
            return result;
        }

        if (value !== undefined) {
            // Validate range
            if (value < 1 || value > question.points) {
                result.valid = false;
                result.errors.push(`Value must be between 1 and ${question.points}`);
            }

            // Calculate position metrics
            result.metrics.position = calculateSemanticPosition(value, question.points);
            result.metrics.distanceFromMidpoint = Math.abs(value - 1 - question.midpoint);
            result.metrics.polarity = value - 1 > question.midpoint ? 'right' :
                                    value - 1 < question.midpoint ? 'left' : 'neutral';
        }

        return result;
    }
}

// ============================================
// Export for use in main application
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QuestionFactory,
        ResponseValidator,
        calculateMidpoint,
        calculateSemanticPosition
    };
}