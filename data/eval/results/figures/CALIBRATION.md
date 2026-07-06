# Confidence calibration — badge label vs. judged faithfulness

n = 40 judged answers (hybrid_bm25 + Claude generation).
'Grounded' = judge verdict faithful or minor_issues (core claims supported).

| confidence badge | n | grounded | hallucinated | grounded rate |
|---|---|---|---|---|
| high | 13 | 12 | 1 | 92% |
| medium | 15 | 13 | 2 | 87% |
| low | 12 | 9 | 3 | 75% |

**Verdict: calibrated (directionally).** Grounded rate declines monotonically as the badge steps down — the label carries real signal about answer reliability.

Caveats: small n per bucket; judge-based (not human) verdicts; single configuration and date.
