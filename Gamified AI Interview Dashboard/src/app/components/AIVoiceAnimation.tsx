import React from 'react';
import { motion } from 'motion/react';

interface AIVoiceAnimationProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export const AIVoiceAnimation: React.FC<AIVoiceAnimationProps> = ({ isListening, isSpeaking }) => {
  const getBackgroundColor = () => {
    if (isSpeaking) return 'from-green-500/20 to-emerald-500/20';
    if (isListening) return 'from-blue-500/20 to-cyan-500/20';
    return 'from-purple-500/20 to-indigo-500/20';
  };

  const getPulseColor = () => {
    if (isSpeaking) return 'bg-green-500';
    if (isListening) return 'bg-blue-500';
    return 'bg-purple-500';
  };

  const getOrbitColor = () => {
    if (isSpeaking) return 'border-green-500';
    if (isListening) return 'border-blue-500';
    return 'border-purple-500';
  };

  const getSpeakingWaveVariants = () => ({
    animate: {
      height: [20, 60, 40, 80, 35, 70, 45, 75, 30, 65],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: 'loop' as const,
      },
    },
  });

  const getListeningWaveVariants = () => ({
    animate: {
      height: [30, 50, 35, 55, 40, 60, 35, 50, 45, 55],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: 'loop' as const,
      },
    },
  });

  const pulseVariants = {
    animate: {
      scale: [1, 1.3, 1],
      opacity: [0.8, 0.2, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop' as const,
      },
    },
  };

  const orbitVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 8,
        repeat: Infinity,
        repeatType: 'loop' as const,
        ease: 'linear',
      },
    },
  };

  return (
    <div className={`w-full h-screen bg-gradient-to-br ${getBackgroundColor()} flex items-center justify-center relative overflow-hidden`}>
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Central animated orb */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Outer rotating orbit */}
        <motion.div
          className={`absolute inset-0 rounded-full border-2 ${getOrbitColor()} opacity-30`}
          variants={orbitVariants}
          animate="animate"
        />

        {/* Middle orbit */}
        <motion.div
          className={`absolute inset-8 rounded-full border border-dashed ${getOrbitColor()} opacity-20`}
          variants={orbitVariants}
          animate="animate"
          style={{ animationDirection: 'reverse' }}
        />

        {/* Pulsing center circle */}
        <motion.div
          className={`absolute inset-14 rounded-full ${getPulseColor()} opacity-30`}
          variants={pulseVariants}
          animate="animate"
        />

        {/* Core solid circle */}
        <div className={`absolute inset-24 rounded-full ${getPulseColor()} shadow-lg shadow-current`} />

        {/* Status indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-sm font-semibold">
              {isSpeaking && 'AI Speaking'}
              {isListening && 'Listening...'}
              {!isSpeaking && !isListening && 'Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Waveform visualization */}
      {(isSpeaking || isListening) && (
        <div className="absolute bottom-20 flex items-end justify-center gap-2 h-32">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 rounded-full ${getPulseColor()}`}
              variants={isSpeaking ? getSpeakingWaveVariants() : getListeningWaveVariants()}
              animate="animate"
              style={{
                transitionDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating particles */}
      {(isSpeaking || isListening) && (
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${getPulseColor()}`}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos((i / 5) * Math.PI * 2) * 150,
                y: Math.sin((i / 5) * Math.PI * 2) * 150,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop' as const,
                delay: i * 0.2,
              }}
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-4px',
                marginTop: '-4px',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
