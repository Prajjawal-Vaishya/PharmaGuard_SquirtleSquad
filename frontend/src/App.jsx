import { useState } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import SkeletonResults from './components/SkeletonResults';
import RiskMatrix from './components/RiskMatrix';
import ReportModal from './components/ReportModal';
import WarningModal from './components/WarningModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'scanning' | 'done'
  const [modalData, setModalData] = useState(null);

  // Lifted State for Validation
  const [file, setFile] = useState(null);
  const [selectedDrugs, setSelectedDrugs] = useState([]);

  // Validation State
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');

  const handleRun = () => {
    // 1. Validation: File Check
    if (!file) {
      setWarningMsg("Please upload a VCF patient file to begin analysis.");
      setShowWarning(true);
      return;
    }

    // 2. Validation: Drug Check
    if (selectedDrugs.length === 0) {
      setWarningMsg("Please select at least one medication to screen for interactions.");
      setShowWarning(true);
      return;
    }

    if (status === 'scanning') return;
    setStatus('scanning');

    // Simulate processing
    setTimeout(() => setStatus('done'), 2500);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header onRun={handleRun} isScanning={status === 'scanning'} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">

          {/* Left Panel: Inputs */}
          <div className="sticky top-24 space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">Genomic Analysis</h1>
              <p className="text-sm text-slate-400">Upload patient VCF and select drugs to screen against the CPIC database.</p>
            </div>

            <div className="bg-midnight-card border border-slate-800 rounded-2xl p-6 shadow-xl">
              <InputPanel
                file={file} setFile={setFile}
                drugs={selectedDrugs} setDrugs={setSelectedDrugs}
                onRun={handleRun}
                isScanning={status === 'scanning'}
              />
            </div>
          </div>

          {/* Right Panel: Matrix Results */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-slate-800 rounded-2xl bg-midnight-card/50"
                >
                  <p className="text-slate-500 font-mono text-sm">Waiting for Analysis Trigger...</p>
                </motion.div>
              )}

              {status === 'scanning' && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <SkeletonResults />
                </motion.div>
              )}

              {status === 'done' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                >
                  <RiskMatrix onOpenModal={setModalData} selectedDrugs={selectedDrugs} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Report Modal Overlay */}
      {modalData && (
        <ReportModal data={modalData} onClose={() => setModalData(null)} />
      )}

      {/* Warning Modal Overlay */}
      <WarningModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
        message={warningMsg}
      />
    </div>
  );
}
