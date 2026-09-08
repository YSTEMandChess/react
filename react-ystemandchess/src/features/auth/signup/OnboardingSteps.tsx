const steps = ["Create Account", "Add Children", "All Set"];

const OnboardingSteps = ({ current }: { current: number }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              i <= current ? "bg-primary text-light" : "bg-borderLight text-gray"
            }`}
          >
            {i + 1}
          </span>
          <span
            className={`hidden sm:inline text-sm font-bold ${
              i <= current ? "text-dark" : "text-muted"
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <span className={`w-8 h-0.5 mx-1 ${i < current ? "bg-primary" : "bg-borderLight"}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default OnboardingSteps;
