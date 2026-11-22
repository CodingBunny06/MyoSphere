import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export function BarcodeScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let controls: { stop: () => void } | undefined;
    const reader = new BrowserMultiFormatReader();
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is unavailable. Enter the barcode number manually.");
      return;
    }
    reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, _decodeError, streamControls) => {
      controls = streamControls;
      if (result && active) {
        active = false;
        streamControls.stop();
        onDetected(result.getText());
      }
    }).then((streamControls) => { controls = streamControls; }).catch(() => {
      if (active) setError("Could not start the camera. Allow camera access or enter the barcode manually.");
    });
    return () => { active = false; controls?.stop(); };
  }, [onDetected]);
  return <div className="barcode-scanner">
    <div className="barcode-scanner-heading"><strong>Scan product barcode</strong><button type="button" onClick={onClose}>Close</button></div>
    <video ref={videoRef} muted playsInline />
    <p>{error || "Hold the barcode inside the camera view. Camera access requires HTTPS or localhost."}</p>
  </div>;
}
