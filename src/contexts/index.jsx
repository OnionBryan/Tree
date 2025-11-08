import React from 'react';
import { LogicProvider } from './LogicContext';
import { GSUProvider } from './GSUContext';

/**
 * Combined App Providers
 * Wraps all context providers in correct order
 */
export const AppProviders = ({ children }) => {
  return (
    <GSUProvider>
      <LogicProvider>
        {children}
      </LogicProvider>
    </GSUProvider>
  );
};

// Re-export hooks
export { useLogicStore } from './LogicContext';
export { useGSUStore } from './GSUContext';
