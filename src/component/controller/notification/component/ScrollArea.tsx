import React from "react";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200 ${className}`}
      style={{ maxHeight: "305px" }} // You can adjust the max-height as needed
    >
      {children}
    </div>
  );
};

export { ScrollArea };