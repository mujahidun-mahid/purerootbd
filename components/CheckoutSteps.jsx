import Link from "next/link";
import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Delivery", href: "/checkout" },
  { n: 2, label: "Payment", href: "/payment" },
];

export default function CheckoutSteps({ step }) {
  return (
    <ol className="co-steps" aria-label="Checkout progress">
      {STEPS.map((s, i) => {
        const done = s.n < step;
        const current = s.n === step;
        return (
          <li key={s.n} className={`co-step${current ? " current" : ""}${done ? " done" : ""}`}>
            {i > 0 && <span className="co-step-line" aria-hidden="true" />}
            <span className="co-step-num" aria-hidden="true">
              {done ? <Check size={13} /> : s.n}
            </span>
            {done && !current ? (
              <Link href={s.href} className="co-step-label">{s.label}</Link>
            ) : (
              <span className="co-step-label" aria-current={current ? "step" : undefined}>{s.label}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
