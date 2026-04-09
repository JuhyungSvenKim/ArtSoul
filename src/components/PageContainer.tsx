import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer = ({ children, className = "" }: PageContainerProps) => {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className={`mobile-container flex flex-col px-6 py-8 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
