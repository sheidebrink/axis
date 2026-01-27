import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'wave' | 'align' | 'fade'>('wave');

  useEffect(() => {
    const waveTimer = setTimeout(() => setPhase('align'), 2000);
    const alignTimer = setTimeout(() => setPhase('fade'), 3000);
    const completeTimer = setTimeout(onComplete, 3500);

    return () => {
      clearTimeout(waveTimer);
      clearTimeout(alignTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div style={{
      ...styles.container,
      opacity: phase === 'fade' ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      <div style={styles.logoContainer}>
        {'AXIS'.split('').map((letter, i) => (
          <span
            key={i}
            style={{
              ...styles.letter,
              animation: phase === 'wave' 
                ? `wave 1s ease-in-out infinite ${i * 0.1}s`
                : 'none',
              transform: phase === 'align' ? 'translateY(0)' : undefined,
              transition: phase === 'align' ? 'transform 0.5s ease-out' : undefined,
            }}
          >
            {letter}
          </span>
        ))}
        {phase === 'align' && (
          <div style={{
            ...styles.axisLine,
            animation: 'drawLine 0.5s ease-out 0.5s forwards',
          }} />
        )}
      </div>
      <div style={{
        ...styles.subtitle,
        opacity: phase === 'align' || phase === 'fade' ? 1 : 0,
        transition: 'opacity 0.5s ease-in 0.3s',
      }}>
        Axis Claims Desktop
      </div>
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes drawLine {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
    zIndex: 10000,
  },
  logoContainer: {
    display: 'flex',
    gap: 8,
    marginBottom: 32,
    position: 'relative',
  },
  letter: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#0e639c',
    display: 'inline-block',
  },
  axisLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    height: 3,
    width: 0,
    background: '#0e639c',
    transform: 'translateY(-50%)',
  },
  subtitle: {
    fontSize: 24,
    color: '#aaa',
    letterSpacing: 2,
  },
};
