// SECTION: Planet builder logic and 3D scene

(function () {
  // Declare global from CDN so linters know it exists
  /* global THREE */

  // Ensure Three.js is available at runtime
  if (typeof THREE === "undefined") {
    console.warn("Three.js failed to load – 3D planet view disabled.");
    return;
  }

  // SECTION: DOM references
  const canvas = document.getElementById("planetCanvas");
  const form = document.getElementById("planetForm");
  const planetNameInput = document.getElementById("planetName");
  const radiusInput = document.getElementById("radius");
  const densityInput = document.getElementById("density");
  const starTypeSelect = document.getElementById("starType");
  const orbitInput = document.getElementById("orbit");
  const moonsInput = document.getElementById("moons");
  const hasAtmosphereCheckbox = document.getElementById("hasAtmosphere");
  const hasRingsCheckbox = document.getElementById("hasRings");
  const randomizeBtn = document.getElementById("randomizePlanet");
  const resetBtn = document.getElementById("resetPlanet");

  const chips = Array.from(document.querySelectorAll(".chip"));

  // Stats display
  const radiusDisplay = document.getElementById("radiusDisplay");
  const densityDisplay = document.getElementById("densityDisplay");
  const orbitDisplay = document.getElementById("orbitDisplay");
  const moonsDisplay = document.getElementById("moonsDisplay");

  const statRadius = document.getElementById("statRadius");
  const statMass = document.getElementById("statMass");
  const statGravity = document.getElementById("statGravity");
  const statTemperature = document.getElementById("statTemperature");
  const statMoons = document.getElementById("statMoons");
  const statStar = document.getElementById("statStar");

  // Profile display
  const profileName = document.getElementById("profileName");
  const profileTag = document.getElementById("profileTag");
  const profileComposition = document.getElementById("profileComposition");
  const profileClimate = document.getElementById("profileClimate");
  const profileOrbit = document.getElementById("profileOrbit");
  const profileMoons = document.getElementById("profileMoons");

  const compCore = document.getElementById("compCore");
  const compMantle = document.getElementById("compMantle");
  const compVolatiles = document.getElementById("compVolatiles");

  // SECTION: 3D scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);

  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 600;
  const height = rect.height || 320;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0.5, 4.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.1);
  mainLight.position.set(4, 3, 2);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x4f46e5, 0.4);
  fillLight.position.set(-3, -2, -4);
  scene.add(fillLight);

  // Starfield background (simple particles)
  const starCount = 500;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 16;
  }
  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  const starMaterial = new THREE.PointsMaterial({
    size: 0.03,
    color: 0x6b7280,
  });
  const starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);

  // Planet sphere
  const planetGeometry = new THREE.SphereGeometry(1, 64, 64);
  const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.9,
    metalness: 0.15,
  });
  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
  scene.add(planetMesh);

  // Atmosphere glow (slightly larger, transparent sphere)
  const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
  });
  const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphereMesh);

  // Simple ring system
  const ringInnerRadius = 1.3;
  const ringOuterRadius = 2.1;
  const ringGeometry = new THREE.RingGeometry(
    ringInnerRadius,
    ringOuterRadius,
    80
  );
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x818cf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  ringMesh.rotation.x = Math.PI / 2.1;
  ringMesh.visible = false;
  scene.add(ringMesh);

  // Orbit controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.2;
  controls.maxDistance = 6.5;

  // Keep canvas responsive
  function onResize() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 320;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  window.addEventListener("resize", onResize);

  // SECTION: Planet state & helpers
  const BASE_RADIUS_KM = 6371; // Earth radius

  const STAR_TYPES = {
    M: { label: "M‑type", tempFactor: 1.6 },
    K: { label: "K‑type", tempFactor: 1.2 },
    G: { label: "G‑type", tempFactor: 1.0 },
    F: { label: "F‑type", tempFactor: 0.9 },
    A: { label: "A‑type", tempFactor: 0.7 },
  };

  const ELEMENT_COLOR_MAP = {
    Fe: 0xb45309, // rust / iron
    Si: 0x6b7280, // rock
    O: 0x22c55e, // oxygen -> green/blue oceans
    C: 0x111827, // carbon -> dark
    H: 0x38bdf8, // gas giant-ish
    He: 0xfacc15, // golden
    Ni: 0x4b5563,
    Mg: 0xf97316,
  };

  // Simple lerp between two hex colors
  function lerpColor(a, b, t) {
    const ar = (a >> 16) & 0xff;
    const ag = (a >> 8) & 0xff;
    const ab = a & 0xff;
    const br = (b >> 16) & 0xff;
    const bg = (b >> 8) & 0xff;
    const bb = b & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return (rr << 16) | (rg << 8) | rb;
  }

  function getSelectedElements() {
    return chips
      .filter((chip) => chip.classList.contains("chip--selected"))
      .map((chip) => chip.getAttribute("data-element"));
  }

  function calculateColorFromElements(elements) {
    if (!elements.length) return 0x38bdf8; // default
    if (elements.length === 1)
      return ELEMENT_COLOR_MAP[elements[0]] ?? 0x38bdf8;

    // Blend listed colors equally
    let color = ELEMENT_COLOR_MAP[elements[0]] ?? 0x38bdf8;
    for (let i = 1; i < elements.length; i++) {
      const c = ELEMENT_COLOR_MAP[elements[i]] ?? 0x38bdf8;
      const t = 1 / (i + 1);
      color = lerpColor(color, c, t);
    }
    return color;
  }

  function computeStats() {
    const rRel = parseFloat(radiusInput.value);
    const densityRel = parseFloat(densityInput.value);
    const orbitRel = parseFloat(orbitInput.value);
    const moonCount = parseInt(moonsInput.value, 10);
    const starTypeKey = starTypeSelect.value;
    const star = STAR_TYPES[starTypeKey] || STAR_TYPES.G;

    const radiusKm = (BASE_RADIUS_KM * rRel).toFixed(0);
    const massEarth = (rRel ** 3 * densityRel).toFixed(2);
    const gravity = (densityRel * rRel).toFixed(2) * 9.81;
    const gravityRounded = gravity.toFixed(2);

    // Crude equilibrium temperature estimate
    const tempBase = 255; // Earth effective temp in K
    const temp = tempBase * star.tempFactor * Math.pow(1 / orbitRel, 0.5);
    const tempRounded = temp.toFixed(0);

    return {
      radiusKm,
      massEarth,
      gravity: gravityRounded,
      temp: tempRounded,
      moonCount,
      starLabel: star.label,
      starTypeKey,
      orbitRel,
      densityRel,
      rRel,
    };
  }

  function updateStatsUI(stats) {
    radiusDisplay.textContent = `${parseFloat(radiusInput.value).toFixed(
      1
    )} × R⊕`;

    const density = parseFloat(densityInput.value);
    let densityLabel = "Earth‑like";
    if (density < 0.7) densityLabel = "Low density";
    else if (density > 1.3) densityLabel = "Ultra‑dense";
    else if (density < 1) densityLabel = "Slightly light";
    else if (density > 1) densityLabel = "Slightly dense";
    densityDisplay.textContent = densityLabel;

    orbitDisplay.textContent = `${stats.orbitRel.toFixed(1)} AU`;
    moonsDisplay.textContent = String(stats.moonCount);

    statRadius.textContent = stats.radiusKm;
    statMass.textContent = stats.massEarth;
    statGravity.textContent = stats.gravity;
    statTemperature.textContent = stats.temp;
    statMoons.textContent = stats.moonCount;
    statStar.textContent = stats.starLabel;
  }

  function buildProfileText(stats) {
    const name = planetNameInput.value.trim() || "Unnamed world";
    const elements = getSelectedElements();

    // Tag line
    let typePhrase = "";
    const r = stats.rRel;
    const d = stats.densityRel;

    if (d <= 0.7 && r >= 1.5)
      typePhrase = "low‑density giant with extended atmosphere";
    else if (d >= 1.3 && r <= 0.9)
      typePhrase = "compact ultra‑dense terrestrial world";
    else if (r < 0.7) typePhrase = "small rocky world";
    else if (r > 1.4) typePhrase = "super‑Earth with thick mantle layers";
    else typePhrase = "temperate terrestrial world";

    const starLabel = stats.starLabel.toLowerCase();
    profileName.textContent = name;
    profileTag.textContent = `${typePhrase} in a ${starLabel} system`;

    // Composition text
    const hasIron = elements.includes("Fe");
    const hasSilicates = elements.includes("Si") || elements.includes("Mg");
    const hasVolatiles =
      elements.includes("O") ||
      elements.includes("H") ||
      elements.includes("He");
    const hasCarbon = elements.includes("C");

    const compParts = [];
    if (hasIron) compParts.push("an iron‑rich metallic core");
    if (hasSilicates) compParts.push("a thick silicate mantle");
    if (hasVolatiles) compParts.push("volatile‑rich outer layers");
    if (hasCarbon) compParts.push("dark carbon‑heavy regions");

    let compositionSentence = "";
    if (compParts.length) {
      const last = compParts.pop();
      const base = compParts.length
        ? compParts.join(", ") + " and " + last
        : last;
      compositionSentence = `The planet is structured with ${base}.`;
    } else {
      compositionSentence =
        "The planet has a broadly mixed interior without a dominant element family.";
    }

    let densitySentence = "";
    if (stats.densityRel < 0.7)
      densitySentence =
        "Low overall density suggests a significant fraction of lighter ices and gases.";
    else if (stats.densityRel > 1.3)
      densitySentence =
        "High mean density points to a large metallic core and compressed rock.";
    else
      densitySentence =
        "Overall density is comparable to Earth, balancing rock and metal.";

    profileComposition.textContent = `${compositionSentence} ${densitySentence}`;

    // Climate & atmosphere text
    const hasAtmosphere = hasAtmosphereCheckbox.checked;
    const temp = stats.temp;
    let climateDescription = "";

    if (!hasAtmosphere) {
      climateDescription =
        "With little to no atmosphere, surface temperatures swing wildly between day and night, and liquid water is unlikely to remain stable for long.";
    } else {
      if (temp < 200) {
        climateDescription =
          "A cold but stable atmosphere wraps the planet, dominated by frozen volatiles and thin surface frosts. Seas are locked beneath ice for most of the year.";
      } else if (temp < 260) {
        climateDescription =
          "A cool atmosphere supports patchy liquid water and seasonal snow cover, with long winters and brief mild summers near the equator.";
      } else if (temp < 310) {
        climateDescription =
          "A temperate nitrogen‑oxygen envelope maintains widespread liquid water and active weather systems, with clouds and storms cycling heat across the globe.";
      } else if (temp < 360) {
        climateDescription =
          "A dense, warm atmosphere drives powerful storms and thick cloud decks. Liquid water may persist in cooler regions, but heat dominates much of the surface.";
      } else {
        climateDescription =
          "An intense, greenhouse‑driven atmosphere keeps surface temperatures extreme. Most volatiles exist as superheated vapors, and the surface is likely hostile to complex life.";
      }
    }

    profileClimate.textContent = climateDescription;

    // Orbit text
    let orbitDescription = "";
    if (stats.orbitRel < 0.5) {
      orbitDescription =
        "Hugging close to its parent star, the planet completes rapid years and is bathed in intense stellar radiation.";
    } else if (stats.orbitRel < 0.9) {
      orbitDescription =
        "Orbiting inside the traditional habitable zone, the world experiences short, bright years and strong seasonal contrasts.";
    } else if (stats.orbitRel < 1.4) {
      orbitDescription =
        "Residing comfortably within the star’s temperate band, the planet experiences moderate seasons and year lengths comparable to Earth.";
    } else if (stats.orbitRel < 2.2) {
      orbitDescription =
        "On a wide, cold orbit, years are long and winters dominate, with only a brief thaw near periapsis.";
    } else {
      orbitDescription =
        "Far from its primary star, the planet moves slowly through a dim sky, where starlight is a faint glow and surface temperatures trend toward deep cold.";
    }

    profileOrbit.textContent = orbitDescription;

    // Moons & rings text
    let moonText = "";
    if (stats.moonCount === 0) {
      moonText =
        "With no natural satellites, the planet’s night sky is dominated solely by the stars, and its axial tilt may drift over long timescales.";
    } else if (stats.moonCount === 1) {
      moonText =
        "One large moon dominates the night sky, stabilizing the planet’s axial tilt and driving measurable ocean tides.";
    } else if (stats.moonCount <= 3) {
      moonText =
        "A small family of moons sweeps across the sky, sculpting complex tidal patterns and occasionally casting deep eclipses across the surface.";
    } else {
      moonText =
        "A crowded system of moons orbits the planet, likely remnants of past collisions and captured objects, painting the sky with intricate motions.";
    }

    if (hasRingsCheckbox.checked) {
      moonText +=
        " A luminous ring system arcs above the equator, scattering starlight and casting delicate shadows on the cloud tops.";
    }

    profileMoons.textContent = moonText;

    // Composition bar
    const coreFraction =
      hasIron || elements.includes("Ni")
        ? Math.min(0.55, 0.25 + (stats.densityRel - 1) * 0.35)
        : 0.18;
    const mantleFraction = hasSilicates ? 0.45 : 0.3;
    let volFraction = 1 - (coreFraction + mantleFraction);
    if (volFraction < 0.1) volFraction = 0.1;

    compCore.style.width = `${coreFraction * 100}%`;
    compMantle.style.width = `${mantleFraction * 100}%`;
    compVolatiles.style.width = `${volFraction * 100}%`;

    compCore.textContent = "Core metals";
    compMantle.textContent = hasSilicates ? "Rocky mantle" : "Mixed rock";
    compVolatiles.textContent = hasVolatiles
      ? "Volatiles & ices"
      : "Trace volatiles";
  }

  function updatePlanetAppearance(stats) {
    // Adjust planet visual scale
    const visualScale = THREE.MathUtils.clamp(stats.rRel, 0.7, 1.5);
    planetMesh.scale.setScalar(visualScale);
    atmosphereMesh.scale.setScalar(visualScale * 1.04);

    const elements = getSelectedElements();
    const color = calculateColorFromElements(elements);
    planetMesh.material.color.setHex(color);

    // Slightly adjust metalness/roughness based on density and volatiles
    const hasVolatiles =
      elements.includes("H") ||
      elements.includes("He") ||
      elements.includes("O");
    const metallicBoost = stats.densityRel > 1.2 ? 0.25 : 0.1;
    planetMesh.material.metalness = 0.1 + metallicBoost;
    planetMesh.material.roughness = hasVolatiles ? 0.7 : 0.95;

    const hasAtmosphere = hasAtmosphereCheckbox.checked;
    atmosphereMesh.visible = hasAtmosphere;
    atmosphereMesh.material.opacity = hasAtmosphere ? 0.25 : 0;

    ringMesh.visible = hasRingsCheckbox.checked;
  }

  function updateAll() {
    const stats = computeStats();
    updateStatsUI(stats);
    buildProfileText(stats);
    updatePlanetAppearance(stats);
  }

  // SECTION: Event handlers
  radiusInput.addEventListener("input", updateAll);
  densityInput.addEventListener("input", updateAll);
  starTypeSelect.addEventListener("change", updateAll);
  orbitInput.addEventListener("input", updateAll);
  moonsInput.addEventListener("input", updateAll);
  hasAtmosphereCheckbox.addEventListener("change", updateAll);
  hasRingsCheckbox.addEventListener("change", updateAll);
  planetNameInput.addEventListener("input", () => {
    const stats = computeStats();
    buildProfileText(stats);
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("chip--selected");
      updateAll();
    });
  });

  function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomizePlanet() {
    const randomRadius = (Math.random() * 2.7 + 0.3).toFixed(1); // 0.3–3.0
    const randomDensity = (0.4 + Math.random() * 1.2).toFixed(1); // 0.4–1.6
    const randomOrbit = (0.2 + Math.random() * 2.8).toFixed(1); // 0.2–3.0
    const randomMoons = Math.floor(Math.random() * 7); // 0–6
    const starKeys = Object.keys(STAR_TYPES);

    radiusInput.value = randomRadius;
    densityInput.value = randomDensity;
    orbitInput.value = randomOrbit;
    moonsInput.value = randomMoons;
    starTypeSelect.value = randomChoice(starKeys);

    hasAtmosphereCheckbox.checked = Math.random() > 0.2;
    hasRingsCheckbox.checked = Math.random() > 0.5;

    // Random composition: 2–4 elements
    const allElements = chips.map((chip) => chip.getAttribute("data-element"));
    const shuffled = [...allElements].sort(() => Math.random() - 0.5);
    const pickCount = 2 + Math.floor(Math.random() * 3);
    const chosen = new Set(shuffled.slice(0, pickCount));

    chips.forEach((chip) => {
      const el = chip.getAttribute("data-element");
      const shouldSelect = chosen.has(el);
      chip.classList.toggle("chip--selected", shouldSelect);
    });

    // Auto-generate a name
    const syllablesA = [
      "Ae",
      "Ku",
      "Va",
      "Or",
      "Ze",
      "Lu",
      "Ty",
      "Me",
      "Xa",
      "No",
    ];
    const syllablesB = [
      "lon",
      "rus",
      "thos",
      "dara",
      "phus",
      "kara",
      "drin",
      "ion",
      "thea",
    ];
    const suffixes = ["‑1", "‑β", " Prime", " c", " IV"];
    const name =
      randomChoice(syllablesA) +
      randomChoice(syllablesB) +
      randomChoice(suffixes);
    planetNameInput.value = name;

    updateAll();
  }

  function resetPlanet() {
    planetNameInput.value = "Eidolon-1";
    radiusInput.value = "1";
    densityInput.value = "1";
    starTypeSelect.value = "G";
    orbitInput.value = "1";
    moonsInput.value = "1";
    hasAtmosphereCheckbox.checked = true;
    hasRingsCheckbox.checked = false;

    // Reset chips: Fe + Si selected by default
    chips.forEach((chip) => {
      const el = chip.getAttribute("data-element");
      chip.classList.toggle("chip--selected", el === "Fe" || el === "Si");
    });

    updateAll();
  }

  randomizeBtn.addEventListener("click", randomizePlanet);
  resetBtn.addEventListener("click", resetPlanet);

  // Prevent form submission reloading page if Enter is pressed
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  // Initial render
  updateAll();

  // SECTION: Animation loop
  let lastTime = 0;

  function animate(time) {
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    planetMesh.rotation.y += delta * 0.25;
    atmosphereMesh.rotation.y += delta * 0.35;
    starField.rotation.y += delta * 0.02;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
