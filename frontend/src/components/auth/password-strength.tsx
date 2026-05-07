"use client";

import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  requirements: Requirement[];
}

function computeStrength(password: string): Strength {
  const requirements: Requirement[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const met = requirements.filter((r) => r.met).length;
  const palette = ["#D4A5A5", "#C97A4F", "#B8884D", "#7C9A66", "#4A6B5C"];
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return {
    score: met as 0 | 1 | 2 | 3 | 4,
    label: labels[met],
    color: palette[met],
    requirements,
  };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => computeStrength(password), [password]);

  if (password.length === 0) return null;

  return (
    <div className="space-y-2 mt-1.5">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: i < strength.score ? strength.color : "#EBE5D8",
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className="font-medium" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground" aria-live="polite">
        {strength.requirements.map((req) => (
          <li
            key={req.label}
            className={`flex items-center gap-2 ${req.met ? "text-[#4A6B5C]" : ""}`}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: req.met ? "#4A6B5C" : "#C9C2B0" }}
            />
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
