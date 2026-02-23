# Haze

Haze is an interactive wildfire smoke simulation and visualizer built with React, Vite, and MapLibre. It models how smoke particles spread from active fires using real NASA satellite data and live wind forecasts, all rendered with a simulation view or in real time.

## Highlights

- Real-time particle simulation on an interactive MapLibre map
- Two modes: **Sim** (click to place fires) and **Live** (predict future smoke with real NASA FIRMS fire data using wind forecasts)
- Thousands of smoke particles updated every frame with physically-inspired math
- Adjustable wind speed, direction, spread, and particle density from a sidebar panel

## How It Works

Each fire source continuously spawns smoke particles. Every frame, each particle is pushed by wind and jostled by turbulence. Three mathematical ideas drive the simulation:

- **Normal distribution** — Turbulence is modeled to generate Gaussian random noise. This gives particles a natural, bell-curve spread around the wind path rather than uniform scatter, matching how smoke diffuses in real air.
- **Linear interpolation** — Wind data arrives as hourly snapshots on a spatial grid. To get smooth, continuous wind at any point and any moment in time, we interpolate between neighboring grid points and between time steps. Fire brightness temperatures from NASA are also linearly mapped to burn durations.
- **Simplified Navier–Stokes** — Full fluid dynamics equations are far too expensive to solve in a browser. Instead, each particle drifts with the interpolated wind field (advection) and receives noise each step (diffusion).

## Features

- Click anywhere on the map to simulate a fire and watch smoke spread
- Live mode forcasts the effects of real satellite-detected fires with wind data
- Particle color shifts from red to orange to yellow based on how far each particle has drifted from its expected path
- Sidebar controls for wind speed, heading, spread intensity, particle density, and simulation speed
- Pause, resume, and reset the simulation at any time
- Stop individual fires from the control panel