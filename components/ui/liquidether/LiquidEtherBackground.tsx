import LiquidEther from "./LiquidEther"

const LiquidEtherBackground: React.FC = () => {
    return (
        <div
            className="fixed inset-0 w-full h-screen pointer-events-none z-0"
            suppressHydrationWarning={true}
        >
            <LiquidEther
                colors={['#5227FF', '#FF9FFC', '#B19EEF']}
                mouseForce={20}
                cursorSize={100}
                isViscous={false}
                viscous={30}
                iterationsViscous={32}
                iterationsPoisson={32}
                resolution={0.1}
                isBounce={false}
                autoDemo={true}
                autoSpeed={0.5}
                autoIntensity={2.2}
                takeoverDuration={0.25}
                autoResumeDelay={500}
                autoRampDuration={0.6}
                className="w-full h-full"
            />
        </div>
    )
};

export default LiquidEtherBackground;