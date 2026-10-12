# Planet Foundry 🪐

> Design a custom world. Tune its physics, chemistry, and star system in real time.

**Planet Foundry** is an interactive web application built with vanilla JavaScript and Three.js that allows users to sculpt, configure, and visualize their own virtual planets[cite: 1, 2]. As you tweak planetary parameters like mass, density, elemental composition, and stellar distance, the 3D model, stats, and a dynamically generated narrative profile update instantly[cite: 1, 2].

---

## ✨ Features

- **Interactive 3D Planet Viewer:** Powered by **Three.js**[cite: 2] with smooth orbit controls (drag to rotate, scroll to zoom)[cite: 1], dynamic atmospheric glow, and an optional planetary ring system[cite: 2].
- **Real-Time Physics & Chemistry Engine:** Adjust radius, bulk density, and orbital distance to automatically calculate derived statistics such as surface gravity, mass relative to Earth, and equilibrium temperature[cite: 1, 2].
- **Element Composition Builder:** Select dominant elements (Iron, Silicon, Oxygen, Carbon, Hydrogen, Helium, Nickel, Magnesium) that blend to determine the planet's visual color, mantle breakdown, and structural description[cite: 1, 2].
- **Star System Integration:** Choose from multiple star types (M, K, G, F, A-type stars)[cite: 1, 2] to see how stellar radiation impacts your planet's climate profile[cite: 2].
- **Generative Planet Profiles:** Reads your configurations to synthesize a rich, narrative summary covering composition, climate, orbital story, and moons[cite: 1, 2].
- **Quick Tools:** Includes a "Surprise me" randomizer that generates unique procedural worlds and a reset option to return to default baseline settings[cite: 1, 2].

---

## 🛠️ Tech Stack

- **HTML5** – Structured semantic markup[cite: 1].
- **CSS3** – Modern layouts using CSS Grid/Flexbox, custom properties (design tokens), gradient meshes, and grain overlays[cite: 3].
- **JavaScript (ES6+)** – Reactive state management, DOM manipulation, and dynamic math calculations[cite: 2].
- **Three.js (r128)** – 3D WebGL rendering engine loaded via CDN alongside `OrbitControls`[cite: 1, 2].

---

## 📁 Project Structure

```text
├── index.html    # Main application markup and UI layout shells[cite: 1]
├── style.css     # Styling, design tokens, themes, and responsive design[cite: 3]
└── script.js     # Three.js 3D scene setup, physics calculations, and UI event binding[cite: 2]
```
