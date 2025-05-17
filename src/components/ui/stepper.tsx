'use client';

import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="relative w-64">
      {steps.map((step, index) => (
        <div key={index} className="relative mb-8">
          {/* Step container */}
          <div className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  border-2
                  ${
                    index < currentStep
                      ? 'bg-[#E57F84] border-[#E57F84] text-white'
                      : index === currentStep
                      ? 'bg-[#E57F84] border-[#E57F84] text-white'
                      : 'bg-muted border-border text-muted-foreground'
                  }
                `}
              >
                {index < currentStep ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            </div>
            {/* Text */}
            <div className={`
              text-sm md:text-base lg:text-lg font-medium ml-4
              ${
                index === currentStep
                  ? 'text-[#E57F84]'
                  : index < currentStep
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }
            `}>
              {step}
            </div>
          </div>
          {/* Vertical line */}
          {index < steps.length - 1 && (
            <div
              className={`
                absolute left-4 w-0.5 h-16
                ${index < currentStep ? 'bg-[#E57F84]' : 'bg-border'}
              `}
              style={{
                top: '100%'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Stepper;
