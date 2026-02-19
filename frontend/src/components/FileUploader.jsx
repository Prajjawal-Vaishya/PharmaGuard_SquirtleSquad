import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, X } from 'lucide-react';

export default function FileUploader({ isScanning }) {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.name.endsWith('.vcf')) {
            setFile(droppedFile);
        }
    }, []);

    const handleFileSelect = (e) => {
        const selected = e.target.files?.[0];
        if (selected) setFile(selected);
    };

    return (
        <section aria-label="VCF File Uploader" className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden h-full">
            {/* Scanning overlay */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        className="absolute inset-0 z-10 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-teal/5" />
                        <div className="scan-line absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-teal to-transparent shadow-[0_0_15px_var(--color-teal)]" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-teal" />
                <h2 className="text-sm font-semibold text-text-primary tracking-wide">Genome Upload</h2>
            </div>

            {/* Drop zone */}
            <label
                id="file-drop-zone"
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
          relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-300 flex-1 min-h-[180px]
          ${isDragging
                        ? 'border-teal bg-teal/10 shadow-[inset_0_0_30px_rgba(0,242,173,0.1)]'
                        : 'border-border hover:border-teal/30 bg-surface/30 hover:bg-surface/50'
                    }
        `}
            >
                <input
                    type="file"
                    accept=".vcf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="vcf-file-input"
                />

                <motion.div
                    animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center border border-teal/20">
                        <Upload className="w-6 h-6 text-teal" />
                    </div>
                </motion.div>

                <div className="text-center">
                    <p className="text-sm text-text-primary font-medium">
                        {isDragging ? 'Release to upload' : 'Drop .VCF file here'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">or click to browse</p>
                </div>
            </label>

            {/* File info */}
            <AnimatePresence>
                {file && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-teal/5 border border-teal/20"
                    >
                        <FileText className="w-5 h-5 text-teal shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary truncate">{file.name}</p>
                            <p className="text-xs text-text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                        <button
                            onClick={(e) => { e.preventDefault(); setFile(null); }}
                            className="text-text-secondary hover:text-danger transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
