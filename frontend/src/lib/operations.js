import React, { createContext, useContext, useState, useCallback } from 'react';

const OperationsContext = createContext({
  activeOp: null,
  startOperation: () => {},
  finishOperation: () => {},
  failOperation: () => {},
});

export function OperationsProvider({ children }) {
  const [activeOp, setActiveOp] = useState(null); // { type, label, isRunning: true, id?: string }

  const startOperation = useCallback(({ type, label, id }) => {
    setActiveOp({ type, label, isRunning: true, id });
  }, []);

  const finishOperation = useCallback(() => {
    setActiveOp(null);
  }, []);

  const failOperation = useCallback(() => {
    setActiveOp(null);
  }, []);

  return React.createElement(
    OperationsContext.Provider,
    {
      value: {
        activeOp,
        startOperation,
        finishOperation,
        failOperation,
      },
    },
    children
  );
}

export function useOperations() {
  return useContext(OperationsContext);
}
