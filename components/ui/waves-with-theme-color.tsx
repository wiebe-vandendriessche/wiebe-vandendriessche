"use client"

import React, { useEffect, useState } from "react";
import Waves from "@/components/ui/waves";

const WavesWithThemeColor: React.FC<React.ComponentProps<typeof Waves>> = (props) => {
  const [colors, setColors] = useState({
    lineColor: "#fff",
    backgroundColor: "#fff",
  });

  useEffect(() => {
    const getColors = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      return {
        lineColor: computedStyle.getPropertyValue("--color-waves-lines").trim() || "#fff",
        backgroundColor: computedStyle.getPropertyValue("--color-waves-background").trim() || "#fff",
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