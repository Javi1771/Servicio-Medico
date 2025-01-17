"use client";

import React, { ReactNode } from "react";

interface GeneralLayoutProps {
  children: ReactNode;
}

const GeneralLayout: React.FC<GeneralLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      <main className="p-6">{children}</main>
    </div>
  );
};

export default GeneralLayout;
