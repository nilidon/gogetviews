"use client";

import { Check } from "lucide-react";

interface Step {
  title: string;
  hint: string;
}

interface StepProgressProps {
  steps: readonly Step[];
  current: number;
}

export function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <div className="mb-8 rounded-2xl border border-border/80 bg-surface/40 px-2 py-4 backdrop-blur-sm sm:px-4 sm:py-5">
      <div className="flex">
        {steps.map((step, index) => {
          const isActive = index === current;
          const isComplete = index < current;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.title} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    index === 0
                      ? "invisible"
                      : index <= current
                        ? "bg-primary"
                        : "bg-border"
                  }`}
                />
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 sm:h-11 sm:w-11 ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20"
                      : isComplete
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "border border-border bg-surface-2 text-muted"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </div>
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    isLast ? "invisible" : index < current ? "bg-primary" : "bg-border"
                  }`}
                />
              </div>
              <span
                className={`mt-2.5 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                  isActive
                    ? "text-foreground"
                    : isComplete
                      ? "text-primary"
                      : "text-muted"
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
