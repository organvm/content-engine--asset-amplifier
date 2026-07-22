import React, { useRef, useState, useEffect } from 'react';
import './index.css';

const RecursiveCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [seedImage, setSeedImage] = useState<HTMLImageElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [depth, setDepth] = useState(4);
  const reqRef = useRef<number>(0);

  // Handle seed image upload
  const handleSeedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setSeedImage(img);
    };
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1080 }, height: { ideal: 1080 }, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is required for the recursive mirror effect.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // Render Loop
  const renderLoop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;

    if (canvas && ctx && seedImage) {
      // Set canvas size to seed image size or fallback
      if (canvas.width !== seedImage.width) {
        canvas.width = seedImage.width;
        canvas.height = seedImage.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Recursive render logic
      const drawRecursively = (level: number, x: number, y: number, w: number, h: number) => {
        if (level === 0) return;

        // Draw seed image at this level
        ctx.drawImage(seedImage, x, y, w, h);

        if (cameraActive && video && video.readyState >= 2) {
          // Calculate insertion window (e.g., center 40%)
          // In a real NARCISSUS pipeline, this would map to designated 'negative space' coordinates.
          const innerW = w * 0.4;
          const innerH = h * 0.4;
          const innerX = x + (w - innerW) / 2;
          const innerY = y + (h - innerH) / 2;

          // Draw the camera feed into the negative space
          // Calculate crop for square-ish video to fit inner rect
          const vAspect = video.videoWidth / video.videoHeight;
          const iAspect = innerW / innerH;
          
          let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
          if (vAspect > iAspect) {
             sw = video.videoHeight * iAspect;
             sx = (video.videoWidth - sw) / 2;
          } else {
             sh = video.videoWidth / iAspect;
             sy = (video.videoHeight - sh) / 2;
          }

          ctx.drawImage(video, sx, sy, sw, sh, innerX, innerY, innerW, innerH);

          // Recursively draw into the next layer (making it an infinite mirror)
          drawRecursively(level - 1, innerX, innerY, innerW, innerH);
        }
      };

      drawRecursively(depth, 0, 0, canvas.width, canvas.height);
    }

    reqRef.current = requestAnimationFrame(renderLoop);
  };

  useEffect(() => {
    reqRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [seedImage, cameraActive, depth]);

  return (
    <div className="workspace">
      <div className="controls">
        <label className="btn">
          <span>Upload Seed</span>
          <input type="file" accept="image/*" onChange={handleSeedUpload} className="hidden" />
        </label>
        
        {cameraActive ? (
          <button className="btn" onClick={stopCamera}>Stop Camera</button>
        ) : (
          <button className="btn btn-primary" onClick={startCamera}>Activate Mirror</button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--glass-bg)', padding: '0 1rem', borderRadius: '99px', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.8rem', color: '#888' }}>Depth</span>
          <input 
            type="range" 
            min="1" max="10" 
            value={depth} 
            onChange={e => setDepth(Number(e.target.value))} 
            style={{ width: '80px', accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: '0.8rem', width: '20px', textAlign: 'center' }}>{depth}</span>
        </div>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} />
        {!seedImage && (
          <div className="empty-state">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p>Upload a seed image to begin.</p>
          </div>
        )}
      </div>

      {/* Hidden video element for capturing camera stream */}
      <video ref={videoRef} playsInline muted className="hidden" />
    </div>
  );
};

export default function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>NARCISSUS v0</h1>
        <p>Recursive Insertion Prototype</p>
      </header>
      
      <main style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <RecursiveCanvas />
      </main>
    </div>
  );
}
