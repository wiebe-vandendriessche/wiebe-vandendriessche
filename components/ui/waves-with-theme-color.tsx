"use client"

import React, { useEffect, useState } from "react";
import Waves from "@/components/ui/waves";

const WavesWithThemeColor: React.FC<React.ComponentProps<typeof Waves>> = (props) => {
  const [colors, setColors] = useState({
    lineColor: "transparent",
    backgroundColor: "transparent",
  });

  useEffect(() => {
    const getColors = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      return {
        lineColor: computedStyle.getPropertyValue("--color-primary").trim() || "#fff",
        backgroundColor: computedStyle.getPropertyValue("--color-secondary").trim() || "#fff",
      };
    };

    setColors(getColors());

    const observer = new MutationObserver(() => {
      setColors(getColors());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Waves
      {...props}
      lineColor={colors.lineColor}
      backgroundColor={colors.backgroundColor}
    />
  );
};

export default WavesWithThemeColor;