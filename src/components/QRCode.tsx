import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeProps {
  text: string;
  size?: number;
  className?: string;
}

export function QRCodeComponent({ text, size = 200, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, text, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }).catch((err) => {
        console.error("Error generating QR code:", err);
      });
    }
  }, [text, size]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas ref={canvasRef} />
      <p className="text-xs text-gray-500 mt-2 text-center max-w-[200px]">
        Scan to register attendance
      </p>
    </div>
  );
}
