import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import RiskMatrix from './components/RiskMatrix';
import AITrace from './components/AITrace';

export default function App() {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 4000);
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-midnight p-3 md:p-5 flex flex-col gap-3 md:gap-4">
      {/* Header — full width */}
      <Header onScan={handleScan} isScanning={isScanning} />

      {/* Bento grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-3 md:gap-4 auto-rows-min lg:auto-rows-fr">
        {/* Left sidebar — File Uploader */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FileUploader isScanning={isScanning} />
        </motion.div>

        {/* Center — Risk Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <RiskMatrix isScanning={isScanning} />
        </motion.div>

        {/* Right sidebar — AI Trace */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AITrace isScanning={isScanning} />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3">
        <p className="text-[11px] text-text-secondary tracking-wider">
          PharmaGuard v1.0 &mdash; Pharmacogenomics AI Terminal &mdash; SquirtleSquad
        </p>
      </footer>
    </div>
  );
}
