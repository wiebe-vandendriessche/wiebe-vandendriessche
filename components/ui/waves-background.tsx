"use client";

import WavesWithThemeColor from "./waves-with-theme-color";

const WavesBackground: React.FC = () => {

  return (
    <div
      className="absolute inset-0 w-full min-h-screen h-screen"
      suppressHydrationWarning={true}
    >
      <WavesWithThemeColor
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
        className="w-full h-full"
      />
    </div>
  );
};

export default WavesBackground;
