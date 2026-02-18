import React from "react";
import { Link } from "react-router-dom";

const WireframeLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* --- WIREFRAME NAVBAR --- */}
      <nav className="flex items-center justify-between border-b-2 border-gray-300 bg-white px-6 py-4">
        {/* Logo */}
        <div className="text-2xl font-bold tracking-tighter">
          42 Chess{" "}
          <span className="text-xs font-normal text-gray-400">
            (Wireframe Mode)
          </span>
        </div>

        {/* Navigation */}
        <div className="flex gap-8 text-lg font-medium text-gray-600">
          <button className="text-black underline underline-offset-4 decoration-2">
            Dashboard
          </button>
          <button className="hover:text-black">Games</button>
          <button className="hover:text-black">Social</button>
        </div>

        {/* Auth Buttons */}
        <div className="flex gap-4">
          <button className="rounded border border-gray-400 px-4 py-1 hover:bg-gray-100">
            Login
          </button>
          <button className="rounded bg-black px-4 py-1 text-white hover:bg-gray-800">
            Register
          </button>
        </div>
      </nav>

      {/* --- CONTENT AREA --- */}
      <main className="mx-auto max-w-7xl p-6">{children}</main>

      {/* Helper Link to go back to real app */}
      <div className="fixed bottom-4 right-4 opacity-50 hover:opacity-100">
        <Link
          to="/"
          className="bg-red-500 text-white px-3 py-1 rounded text-xs"
        >
          Exit Wireframe
        </Link>
      </div>
    </div>
  );
};

export default WireframeLayout;
