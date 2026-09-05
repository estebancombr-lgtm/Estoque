import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Camera, Barcode, Check, Keyboard, Volume2 } from 'lucide-react';

export const BarcodeScannerModal: React.FC = () => {
  const { isScannerOpen, closeBarcodeScanner, scannerCallback, products } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play a crisp beep sound when barcode is read
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High pitch supermarket scanner beep
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  const handleBarcodeScanned = (code: string) => {
    playBeep();
    if (scannerCallback) {
      scannerCallback(code);
    }
    closeBarcodeScanner();
  };

  // Start real camera when modal opens
  useEffect(() => {
    if (!isScannerOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setCameraError(null);
      setManualCode('');
      return;
    }

    // Try opening camera
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      })
      .catch((err) => {
        console.warn('Camera access not granted or unavailable:', err);
        setCameraError('Câmera física não disponível ou permissão negada. Use o leitor simulado ou entrada manual.');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isScannerOpen]);

  if (!isScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Leitor Óptico de Código de Barras (EAN-13)</span>
          </div>
          <button
            onClick={closeBarcodeScanner}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Area */}
        <div className="relative bg-slate-950 h-56 flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="text-center p-4 text-slate-400">
              <Camera className="w-10 h-10 mx-auto mb-2 text-slate-600 animate-pulse" />
              <p className="text-xs text-slate-300 font-medium">Mira Óptica do Scanner</p>
              {cameraError && <p className="text-[11px] text-amber-400 mt-1 max-w-xs mx-auto">{cameraError}</p>}
            </div>
          )}

          {/* Laser targeting UI */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-blue-400/70 rounded-xl relative flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
              {/* Red laser scanning line */}
              <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce" />
            </div>
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-black/50 px-2.5 py-1 rounded backdrop-blur-xs">
            <span>Aponte para o código EAN-13</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Volume2 className="w-3 h-3" /> Bip Ativo
            </span>
          </div>
        </div>

        {/* Quick Test Barcode Pills */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>Bipar Produto do Catálogo (Simulação Instantânea):</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {products.map((prod) => (
              <button
                key={prod.id}
                onClick={() => handleBarcodeScanned(prod.barcode)}
                className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-800 font-medium transition-all shadow-2xs text-left"
              >
                <div className="font-semibold text-[11px] text-slate-900 truncate max-w-[180px]">{prod.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{prod.barcode}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Keyboard Input */}
        <div className="p-4 bg-white">
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-slate-500" /> Ou digite o código manualmente:
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) {
                handleBarcodeScanned(manualCode.trim());
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex: 7891234560011 ou SKU"
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Confirmar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
