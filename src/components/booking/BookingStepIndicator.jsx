import { Check } from 'lucide-react';

const BookingStepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="w-full py-4 mb-6">
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <div key={index} className="flex items-center">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300
                    ${isCompleted ? 'bg-success-500 text-white shadow-md' : ''}
                    ${isCurrent ? 'bg-primary-600 text-white shadow-lg ring-4 ring-primary-100' : ''}
                    ${isFuture ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium whitespace-nowrap
                    ${isCurrent ? 'text-primary-700' : ''}
                    ${isCompleted ? 'text-success-700' : ''}
                    ${isFuture ? 'text-gray-400' : ''}
                  `}
                >
                  {step}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-0.5 w-16 lg:w-24 mx-2 mb-5 transition-all duration-500
                    ${index < currentStep ? 'bg-success-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact stepper */}
      <div className="flex sm:hidden items-center justify-between px-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Left connector */}
                {index > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      index <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Circle */}
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${isCompleted ? 'bg-success-500 text-white' : ''}
                    ${isCurrent ? 'bg-primary-600 text-white ring-2 ring-primary-200' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : index + 1}
                </div>

                {/* Right connector */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      index < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Label — only show current on mobile */}
              {isCurrent && (
                <span className="mt-1 text-xs font-medium text-primary-700 text-center leading-tight">
                  {step}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: step counter */}
      <div className="sm:hidden text-center mt-1">
        <span className="text-xs text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>
    </div>
  );
};

export default BookingStepIndicator;
