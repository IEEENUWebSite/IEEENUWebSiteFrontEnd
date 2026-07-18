import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function LoadingBar() {
  const location = useLocation();
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(1);
    setWidth(10);
    
    const progressTimer = setTimeout(() => {
      setWidth(40);
    }, 100);

    const progressTimer2 = setTimeout(() => {
      setWidth(75);
    }, 300);

    const progressTimer3 = setTimeout(() => {
      setWidth(90);
    }, 600);

    const completeTimer = setTimeout(() => {
      setWidth(100);
      const fadeTimer = setTimeout(() => {
        setOpacity(0);
        const resetTimer = setTimeout(() => {
          setWidth(0);
        }, 300);
        return () => clearTimeout(resetTimer);
      }, 300);
      return () => clearTimeout(fadeTimer);
    }, 850);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(completeTimer);
    };
  }, [location]);

  return (
    <div className="top-loading-bar-container" style={{ opacity }}>
      <div className="top-loading-bar" style={{ width: `${width}%` }}></div>
    </div>
  );
}
