import { useEffect, useCallback, useRef } from 'react';

interface UseBarcodeSccannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxDelay?: number;
}

export function useBarcodeScanner({
  onScan,
  minLength = 3,
  maxDelay = 50,
}: UseBarcodeSccannerOptions) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const now = Date.now();
      
      // If too much time has passed, reset the buffer
      if (now - lastKeyTime.current > maxDelay) {
        buffer.current = '';
      }
      
      lastKeyTime.current = now;

      // Handle Enter key - submit the barcode
      if (event.key === 'Enter') {
        if (buffer.current.length >= minLength) {
          onScan(buffer.current);
        }
        buffer.current = '';
        return;
      }

      // Only accept alphanumeric characters
      if (event.key.length === 1 && /^[a-zA-Z0-9]$/.test(event.key)) {
        buffer.current += event.key;
      }
    },
    [onScan, minLength, maxDelay]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const manualScan = useCallback(
    (barcode: string) => {
      if (barcode.length >= minLength) {
        onScan(barcode);
      }
    },
    [onScan, minLength]
  );

  return { manualScan };
}
