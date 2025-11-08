/**
 * Gate Configuration
 * Defines all gate types, colors, properties, and metadata
 * Extracted from Canvas #5 (tree-builder.html)
 */

export const GATE_TYPES = {
  // Logic Gates
  AND: 'and',
  OR: 'or',
  XOR: 'xor',
  NAND: 'nand',
  NOR: 'nor',
  NOT: 'not',

  // Fuzzy Logic Gates
  FUZZY_AND: 'fuzzy_and',
  FUZZY_OR: 'fuzzy_or',
  FUZZY_NOT: 'fuzzy_not',
  FUZZY_PRODUCT: 'fuzzy_product',

  // Threshold Gates
  MAJORITY: 'majority',
  THRESHOLD: 'threshold',

  // Advanced Gates
  ROUTER: 'router',
  MERGE: 'merge',
  DECISION: 'decision',
  PROCESS: 'process'
};

/**
 * Gate color mappings for visual rendering
 * From Canvas #5 initializeConnectionCanvas
 */
export const GATE_COLORS = {
  [GATE_TYPES.AND]: '#8B5CF6',      // Purple
  [GATE_TYPES.OR]: '#6366F1',       // Indigo
  [GATE_TYPES.XOR]: '#EC4899',      // Pink
  [GATE_TYPES.NAND]: '#F59E0B',     // Amber
  [GATE_TYPES.NOR]: '#10B981',      // Emerald
  [GATE_TYPES.NOT]: '#EF4444',      // Red
  [GATE_TYPES.FUZZY_AND]: '#9333EA', // Violet
  [GATE_TYPES.FUZZY_OR]: '#7C3AED',  // Purple
  [GATE_TYPES.FUZZY_NOT]: '#C026D3', // Fuchsia
  [GATE_TYPES.FUZZY_PRODUCT]: '#A855F7', // Purple
  [GATE_TYPES.MAJORITY]: '#3B82F6', // Blue
  [GATE_TYPES.THRESHOLD]: '#14B8A6',// Teal
  [GATE_TYPES.ROUTER]: '#F97316',   // Orange
  [GATE_TYPES.MERGE]: '#84CC16',    // Lime
  [GATE_TYPES.DECISION]: '#6366F1', // Indigo
  [GATE_TYPES.PROCESS]: '#A855F7'   // Purple
};

/**
 * Gate metadata - input/output counts, icons, descriptions
 */
export const GATE_METADATA = {
  [GATE_TYPES.AND]: {
    name: 'AND',
    icon: '∧',
    description: 'All inputs must be true',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'logic'
  },
  [GATE_TYPES.OR]: {
    name: 'OR',
    icon: '∨',
    description: 'At least one input must be true',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'logic'
  },
  [GATE_TYPES.XOR]: {
    name: 'XOR',
    icon: '⊕',
    description: 'Exclusive OR - odd parity',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'logic'
  },
  [GATE_TYPES.NAND]: {
    name: 'NAND',
    icon: '⊼',
    description: 'NOT AND',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'logic'
  },
  [GATE_TYPES.NOR]: {
    name: 'NOR',
    icon: '⊽',
    description: 'NOT OR',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'logic'
  },
  [GATE_TYPES.NOT]: {
    name: 'NOT',
    icon: '¬',
    description: 'Inverts input',
    minInputs: 1,
    maxInputs: 1,
    outputCount: 1,
    category: 'logic'
  },
  [GATE_TYPES.FUZZY_AND]: {
    name: 'FUZZY AND',
    icon: '∧̃',
    description: 'Fuzzy AND using T-norm (min)',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'fuzzy',
    hasParameters: true
  },
  [GATE_TYPES.FUZZY_OR]: {
    name: 'FUZZY OR',
    icon: '∨̃',
    description: 'Fuzzy OR using S-norm (max)',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'fuzzy',
    hasParameters: true
  },
  [GATE_TYPES.FUZZY_NOT]: {
    name: 'FUZZY NOT',
    icon: '¬̃',
    description: 'Fuzzy NOT (1 - x)',
    minInputs: 1,
    maxInputs: 1,
    outputCount: 1,
    category: 'fuzzy'
  },
  [GATE_TYPES.FUZZY_PRODUCT]: {
    name: 'FUZZY PRODUCT',
    icon: '⊗',
    description: 'Fuzzy product T-norm (x * y)',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'fuzzy',
    hasParameters: true
  },
  [GATE_TYPES.MAJORITY]: {
    name: 'MAJORITY',
    icon: 'M',
    description: 'True if more than half inputs are true',
    minInputs: 3,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'threshold'
  },
  [GATE_TYPES.THRESHOLD]: {
    name: 'THRESHOLD',
    icon: 'θ',
    description: 'True if sum exceeds threshold',
    minInputs: 1,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'threshold',
    hasParameters: true
  },
  [GATE_TYPES.ROUTER]: {
    name: 'ROUTER',
    icon: '→',
    description: 'Routes signal to specific output',
    minInputs: 1,
    maxInputs: 1,
    outputCount: 2, // Dynamic based on parameters
    category: 'routing',
    hasParameters: true
  },
  [GATE_TYPES.MERGE]: {
    name: 'MERGE',
    icon: '⊎',
    description: 'Combines multiple inputs into one',
    minInputs: 2,
    maxInputs: Infinity,
    outputCount: 1,
    category: 'routing',
    hasParameters: true
  },
  [GATE_TYPES.DECISION]: {
    name: 'DECISION',
    icon: '?',
    description: 'Standard decision node',
    minInputs: 1,
    maxInputs: Infinity,
    outputCount: 2,
    category: 'decision'
  },
  [GATE_TYPES.PROCESS]: {
    name: 'PROCESS',
    icon: 'ƒ',
    description: 'Transforms input value',
    minInputs: 1,
    maxInputs: 1,
    outputCount: 1,
    category: 'transform',
    hasParameters: true
  }
};

/**
 * Gate categories for palette organization
 */
export const GATE_CATEGORIES = {
  LOGIC: {
    id: 'logic',
    name: 'Logic Gates',
    gates: [
      GATE_TYPES.AND,
      GATE_TYPES.OR,
      GATE_TYPES.XOR,
      GATE_TYPES.NAND,
      GATE_TYPES.NOR,
      GATE_TYPES.NOT
    ]
  },
  FUZZY: {
    id: 'fuzzy',
    name: 'Fuzzy Logic',
    gates: [
      GATE_TYPES.FUZZY_AND,
      GATE_TYPES.FUZZY_OR,
      GATE_TYPES.FUZZY_NOT,
      GATE_TYPES.FUZZY_PRODUCT
    ]
  },
  THRESHOLD: {
    id: 'threshold',
    name: 'Threshold Gates',
    gates: [
      GATE_TYPES.MAJORITY,
      GATE_TYPES.THRESHOLD
    ]
  },
  ROUTING: {
    id: 'routing',
    name: 'Routing',
    gates: [
      GATE_TYPES.ROUTER,
      GATE_TYPES.MERGE
    ]
  },
  OTHER: {
    id: 'other',
    name: 'Other',
    gates: [
      GATE_TYPES.DECISION,
      GATE_TYPES.PROCESS
    ]
  }
};

/**
 * Connection types for edge creation
 */
export const CONNECTION_TYPES = {
  NORMAL: 'normal',
  CONDITIONAL: 'conditional',
  FEEDBACK: 'feedback',
  BYPASS: 'bypass'
};

/**
 * Connection type metadata
 */
export const CONNECTION_TYPE_METADATA = {
  [CONNECTION_TYPES.NORMAL]: {
    name: 'Normal',
    description: 'Standard forward connection',
    style: 'solid',
    color: '#6366F1'
  },
  [CONNECTION_TYPES.CONDITIONAL]: {
    name: 'Conditional',
    description: 'Activated only when condition is met',
    style: 'dashed',
    color: '#EC4899'
  },
  [CONNECTION_TYPES.FEEDBACK]: {
    name: 'Feedback',
    description: 'Backward connection (creates loop)',
    style: 'dotted',
    color: '#F59E0B'
  },
  [CONNECTION_TYPES.BYPASS]: {
    name: 'Bypass',
    description: 'Skip connection (layer jumping)',
    style: 'double',
    color: '#10B981'
  }
};

/**
 * Merge strategies for merge nodes
 * From SignalFlowEngine.executeMerge
 */
export const MERGE_STRATEGIES = {
  AND: 'and',
  OR: 'or',
  SUM: 'sum',
  AVERAGE: 'average',
  MAX: 'max',
  MIN: 'min'
};

/**
 * Process types for process nodes
 * From SignalFlowEngine.executeProcess
 */
export const PROCESS_TYPES = {
  MULTIPLY: 'multiply',
  ADD: 'add',
  MODULO: 'modulo',
  CLAMP: 'clamp',
  PASSTHROUGH: 'passthrough'
};
