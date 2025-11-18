"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  return (
    <div className="text-white sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
      <header>
        {/* Container for alignment and max width */}
        <div className="max-w-screen-xl mx-auto flex items-center justify-center h-16 px-6">
          {/* -------- Left Side (Logo + Brand) -------- */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/coding.png"
              alt="Nexus Code Logo"
              width={32}
              height={32}
            />
            <p className="text-xl font-bold">Nexus Code</p>
          </Link>
        </div>
      </header>
    </div>
  );
};

export default Navbar;