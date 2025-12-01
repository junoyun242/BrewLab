# BrewLab

BrewLab is a lightweight coffee–brewing companion designed for home baristas who want precision without complexity.  

It lets you create, manage, and run custom brew recipes for V60, AeroPress, Kalita, French Press, Espresso, and other methods.  

Each recipe is broken into timed steps, and BrewLab guides you through the entire process with a clean interface, sound cues, and vibration feedback.

BrewLab runs entirely in the browser and stores all data locally, so your recipes stay private and instantly accessible on any device.

---

## Features

### Custom Recipe Builder

Create your own brew recipes with as many steps as you need. Each step includes:  

- Step text  
- Duration in seconds  
- Optional brewer type (V60, AeroPress, Chemex, etc.)  

Recipes automatically record `createdAt`, `updatedAt`, and `lastUsedAt` timestamps.

---

### Guided Brew Mode

Run your recipe using a step-by-step brewing interface:  

- Automatic countdown timers  
- Manual next/previous controls  
- Accurate drift-proof timing  
- Haptic feedback and audio cues when steps end  
- Total brew time display and progress indicator  

The brew mode updates the recipe’s last-used timestamp so your most-used methods appear first on the home screen.

---

### Local Storage Persistence

All recipes are saved directly into the browser using a zustand + localStorage store.  
Nothing is uploaded or synced externally.

---

### Import & Export

Export all recipes as a `.json` file or import them back into any device running BrewLab.  
This allows manual backup or sharing without external services.

---

### Sorting and Organization

Recipes are automatically sorted by `lastUsedAt`, putting your most frequently brewed methods at the top.

---

### Optional Timer

A standalone mechanical-style knob timer exists as an additional utility.

---

## Tech Stack

- React  
- TypeScript  
- Vite  
- zustand (with persistence layer)  
- Mantine UI  
- TanStack Router  
- LocalStorage for data  

---

## Philosophy

BrewLab is built for people who want a structured but flexible brewing workflow.  

Instead of forcing predefined recipes, BrewLab helps you design your own and then executes them with precision.  

The goal is to bring clarity, focus, and repeatability to your pour-over or immersion routines without turning your phone into another distraction.

---

