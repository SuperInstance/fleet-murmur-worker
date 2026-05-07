# fleet-murmur-worker

[![CI](https://github.com/SuperInstance/fleet-murmur-worker/actions/workflows/ci.yml/badge.svg)](https://github.com/SuperInstance/fleet-murmur-worker/actions/workflows/ci.yml)

TypeScript worker that runs 5 thinking strategies continuously. Results are quality-gated then pushed to PLATO. Part of the Cocapn reverse-actualization truck.

## What It Does

The worker runs a set of parallel "murmur" strategies — each one is a thinking approach that processes fleet data, generates insights, and submits them for quality review. Only insights that pass the quality gate make it to PLATO.

## The 5 Strategies

These are defined in `src/strategies/`:

1. **Connect** — Finds links between fleet data points
2. **Contradict** — Challenges assumptions by looking for opposing evidence
3. **Explore** — Investigates unfamiliar territory in the data
4. **Question** — Probes gaps and inconsistencies in fleet knowledge
5. **Synthesize** — Combines insights from other strategies into coherent findings

## How to Run

```bash
npm install
npm run build
npm start
```

Or in dev mode:

```bash
npm run dev
```

## Quality Gate

Every insight is scored before PLATO submission. Thresholds are configurable in `src/config.ts`. Below-threshold results are logged but not committed.

## Part of the Fleet

Part of [SuperInstance](https://github.com/SuperInstance) fleet. Reports from Murmur (CCC node). Pushes to PLATO for fleet-wide consumption.
