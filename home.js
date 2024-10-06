// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.insertBefore(renderer.domElement, document.body.firstChild);

// Create a planet
const radius = 7;
const spherex = 64;
const spherey = 64;
const geometry = new THREE.SphereGeometry(radius, spherex, spherey);
const texture = new THREE.TextureLoader().load("oceantext.png");
const material = new THREE.MeshPhongMaterial({ map: texture });
const planet = new THREE.Mesh(geometry, material);
planet.position.x = -3; // Move the planet a little to the left
scene.add(planet);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

camera.position.z = 15;

// galaxy background
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,
  transparent: true,
});

const starsVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  starsVertices.push(x, y, z);
}

starsGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starsVertices, 3)
);
const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Add clouds
const cloudGeometry = new THREE.SphereGeometry(
  radius * 1.01,
  spherex,
  spherey
);
const cloudTexture = new THREE.TextureLoader().load(
  "https://i.imgur.com/ZLKcVvV.png"
);
const cloudMaterial = new THREE.MeshPhongMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.8,
});
const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
clouds.position.x = -3; // Move the clouds with the planet
scene.add(clouds);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  starField.rotation.y += 0.0002;
  starField.rotation.x += 0.0001;
  planet.rotation.y += 0.001;
  clouds.rotation.y += 0.0005;

  renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// interaction controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

document.addEventListener("mousedown", () => (isDragging = true));
document.addEventListener("mouseup", () => (isDragging = false));
document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const deltaMove = {
      x: e.offsetX - previousMousePosition.x,
      y: e.offsetY - previousMousePosition.y,
    };
    planet.rotation.y += deltaMove.x * 0.005;
    planet.rotation.x += deltaMove.y * 0.005;
    clouds.rotation.y += deltaMove.x * 0.005;
    clouds.rotation.x += deltaMove.y * 0.005;
  }
  previousMousePosition = { x: e.offsetX, y: e.offsetY };
});

// Scroll event to show planet information and zoom
let currentCameraPosition = { x: 0, y: 0, z: 15 };
let currentPlanetRotation = { x: 0 };

window.addEventListener("scroll", () => {
  const scrollPosition = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // Calculate scroll progress (0 to 1)
  const scrollProgress = scrollPosition / (documentHeight - windowHeight);

  // Define target positions for each scroll section
  let targetCameraPosition, targetPlanetRotation;

  if (scrollProgress < 0.33) {
    // Focus on water (first third of the scroll)
    targetCameraPosition = {
      x: 0,
      y: -scrollProgress * 2.0,
      z: 15 - scrollProgress * 5
    };
    targetPlanetRotation = { x: (-scrollProgress * Math.PI) / 4 };
  } else if (scrollProgress < 0.66) {
    // Focus on atmosphere (second third of the scroll)
    const localProgress = (scrollProgress - 0.33) * 3;
    targetCameraPosition = {
      x: 0,
      y: -2.0 + localProgress * 4.5,
      z: 10 - localProgress * 1
    };
    targetPlanetRotation = { x: -Math.PI / 4 + (localProgress * Math.PI) / 4 };
  } else {
    // Focus on land (last third of the scroll)
    const localProgress = (scrollProgress - 0.66) * 3;
    targetCameraPosition = {
      x: 0,
      y: 2.5 + localProgress * 2.5,
      z: 9 + localProgress * 1
    };
    targetPlanetRotation = { x: (localProgress * Math.PI) / 4 };
  }

  // Smoothly interpolate between current and target positions
  currentCameraPosition.x += (targetCameraPosition.x - currentCameraPosition.x) * 0.05;
  currentCameraPosition.y += (targetCameraPosition.y - currentCameraPosition.y) * 0.05;
  currentCameraPosition.z += (targetCameraPosition.z - currentCameraPosition.z) * 0.05;
  currentPlanetRotation.x += (targetPlanetRotation.x - currentPlanetRotation.x) * 0.05;

  // Apply the interpolated positions
  camera.position.set(currentCameraPosition.x, currentCameraPosition.y, currentCameraPosition.z);
  planet.rotation.x = currentPlanetRotation.x;

  // Update planet and related object positions
  planet.position.y = -scrollPosition * 0.00025;
  clouds.position.y = planet.position.y;

  const bigHeading = document.getElementById("big-heading");
  bigHeading.style.opacity = Math.max(
    0,
    1 - scrollPosition / windowHeight
  );

  starField.position.y = scrollPosition * 0.01;

  // Animate info boxes
  const infoBoxes = document.querySelectorAll(".info-box");
  infoBoxes.forEach((box, index) => {
    const boxTop = box.getBoundingClientRect().top;
    if (boxTop < windowHeight * 0.75) {
      setTimeout(() => {
        box.classList.add("visible");
      }, index * 200);
    }
  });
});