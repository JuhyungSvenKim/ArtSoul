import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer = ({ children, className = "" }: PageContainerProps) => {
  return (
    <div className="min-h-screen bg-background">
      <div className={`max-w-5xl mx-auto w-full flex flex-col px-6 py-8 lg:px-12 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
