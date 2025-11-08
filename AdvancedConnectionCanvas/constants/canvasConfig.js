/**
 * Canvas Configuration
 * Visual settings for canvas rendering
 * Extracted from Canvas #5 (tree-builder.html)
 */

/**
 * Grid settings
 */
export const GRID_CONFIG = {
  enabled: true,
  spacing: 20, // px between grid lines
  color: '#E5E7EB',
  lineWidth: 0.5
};

/**
 * Node rendering settings
 */
export const NODE_CONFIG = {
  width: 80,
  height: 40,
  borderRadius: 0, // Rectangle nodes
  strokeWidth: 1,
  strokeColor: '#FFFFFF',

  // Shadow settings
  shadow: {
    enabled: true,
    color: 'rgba(0, 0, 0, 0.1)',
    blur: 4,
    offsetX: 2,
    offsetY: 2
  },

  // Text settings
  text: {
    font: 'bold 12px system-ui',
    color: '#FFFFFF',
    align: 'center',
    baseline: 'middle'
  }
};

/**
 * Port rendering settings
 */
export const PORT_CONFIG = {
  radius: 5,
  strokeWidth: 1,
  strokeColor: '#FFFFFF',

  // Port colors by state
  input: {
    inactive: '#374151',
    active: '#10B981'
  },
  output: {
    inactive: '#374151',
    active: '#F59E0B'
  },

  // Hit detection
  hitRadius: 8, // Larger area for mouse click detection

  // Port positioning
  offset: 40 // Distance from node center
};

/**
 * Connection rendering settings
 */
export const CONNECTION_CONFIG = {
  strokeWidth: 2,
  color: '#6366F1',

  // Bezier curve settings
  bezier: {
    enabled: true,
    controlPointOffset: 50 // Distance for control points
  },

  // Arrow settings
  arrow: {
    enabled: true,
    width: 8,
    height: 8,
    color: '#6366F1'
  },

  // Label settings
  label: {
    enabled: true,
    backgroundColor: '#FFFFFF',
    borderColor: '#6366F1',
    borderWidth: 1,
    padding: {
      horizontal: 25,
      vertical: 10
    },
    font: '11px system-ui',
    textColor: '#6366F1',
    textAlign: 'center',
    textBaseline: 'middle'
  },

  // Temporary connection (while dragging)
  temporary: {
    strokeWidth: 2,
    color: '#8B5CF6',
    dashArray: [5, 5]
  },

  // Hover state
  hover: {
    strokeWidth: 3,
    color: '#8B5CF6'
  }
};

/**
 * Canvas dimensions and behavior
 */
export const CANVAS_CONFIG = {
  defaultWidth: 800,
  defaultHeight: 600,
  minWidth: 400,
  minHeight: 300,
  backgroundColor: '#FFFFFF',

  // Interaction settings
  cursor: {
    default: 'grab',
    dragging: 'grabbing',
    hovering: 'pointer',
    connecting: 'crosshair'
  },

  // Animation settings
  animation: {
    enabled: false, // Can be enabled for smooth transitions
    duration: 200 // ms
  }
};

/**
 * Threshold input popup settings
 */
export const THRESHOLD_POPUP_CONFIG = {
  width: 200,
  padding: 15,
  backgroundColor: '#FFFFFF',
  borderColor: '#D1D5DB',
  borderWidth: 1,
  borderRadius: 8,

  // Shadow
  shadow: '0 4px 6px rgba(0, 0, 0, 0.1)',

  // Input field
  input: {
    width: '100%',
    padding: 8,
    fontSize: 14,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 4
  },

  // Buttons
  button: {
    padding: {
      horizontal: 12,
      vertical: 6
    },
    fontSize: 12,
    borderRadius: 4
  }
};

/**
 * Port selector popup settings
 */
export const PORT_SELECTOR_CONFIG = {
  maxWidth: 300,
  padding: 15,
  backgroundColor: '#FFFFFF',
  borderColor: '#D1D5DB',
  borderWidth: 1,
  borderRadius: 8,

  // Shadow
  shadow: '0 4px 6px rgba(0, 0, 0, 0.1)',

  // Port button
  portButton: {
    padding: {
      horizontal: 12,
      vertical: 8
    },
    fontSize: 13,
    borderRadius: 6,
    gap: 10 // Space between buttons
  }
};

/**
 * Color palette for various elements
 */
export const COLOR_PALETTE = {
  primary: '#8B5CF6',
  secondary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
};

/**
 * Z-index layers for proper stacking
 */
export const Z_INDEX = {
  canvas: 1,
  connections: 2,
  nodes: 3,
  ports: 4,
  popup: 1000,
  modal: 10000
};
