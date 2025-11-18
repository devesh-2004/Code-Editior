"use client";
import React from "react";
import { motion } from "framer-motion";

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay }}
    className="flex flex-col items-center p-4"
  >
    {/* Placeholder for Icon - replace with actual icon component if using a library */}
    <Icon className="w-10 h-10 text-blue-500 mb-3" />
    <h3 className="text-xl font-semibold mb-1">{title}</h3>
    <p className="text-gray-400 text-sm text-center">{description}</p>
  </motion.div>
);

const About = () => {
  return (
    <div className="flex h-screen w-screen justify-center items-start pt-20 md:pt-32 bg-black text-white overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center w-full max-w-4xl p-4 md:p-8"
      >
        <div className="flex flex-col items-center">
          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-extrabold mb-4 tracking-tighter">
            Nexus Code
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-10">
            Real-time collaborative code editor for developers
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex space-x-4 mb-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 text-lg font-bold bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 transition duration-300"
            >
             <a href="/login">Get Started</a>
            </motion.button>
          </div>

          {/* Divider line for visual separation */}
          <hr className="w-full border-t border-gray-800 mb-10" />

          {/* Feature Highlights */}
          <div className="flex flex-col md:flex-row justify-center space-y-8 md:space-y-0 md:space-x-16 w-full">
            <FeatureCard
              // Placeholder SVG for 'Clean Interface' icon
              icon={({ className }) => (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={className}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              )}
              title="Clean Interface"
              description="Distraction-free coding"
              delay={0.6}
            />
            <FeatureCard
              // Placeholder SVG for 'Real-time Collab' icon
              icon={({ className }) => (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={className}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
              )}
              title="Real-time Collab"
              description="Code together seamlessly"
              delay={0.8}
            />
            <FeatureCard
              // Placeholder SVG for 'Fast & Modern' icon
              icon={({ className }) => (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={className}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z"></path>
                </svg>
              )}
              title="Fast & Modern"
              description="Built for performance"
              delay={1.0}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
