import React, { createContext, useContext } from 'react';

interface DashboardContextType {
  totalReviewCount?: number;
  loadMoreData?: () => void;
  hasMoreData?: boolean;
  loadingMore?: boolean;
}

// Create the context with a default undefined value
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider component
export const DashboardProvider: React.FC<{
  children: React.ReactNode;
  value: DashboardContextType;
}> = ({ children, value }) => {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Hook to use the dashboard context
export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  return context;
};
