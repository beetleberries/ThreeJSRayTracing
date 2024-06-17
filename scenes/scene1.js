
const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load('./images/face.png');
const texture2 = textureLoader.load('./images/texture.JPG');
const textures = [texture1, texture2];

const CubetextureLoader = new THREE.CubeTextureLoader();

// Define the paths to the six images
const texturePaths = [
    './penguins(23)/morning_ft.jpg', // Right
    './penguins(23)/morning_bk.jpg', // Left
    './penguins(23)/morning_up.jpg', // Top
    './penguins(23)/morning_dn.jpg', // Bottom
    './penguins(23)/morning_rt.jpg', // Front
    './penguins(23)/morning_lf.jpg'  // Back
];

// Load the cubemap texture
const skyboxin = CubetextureLoader.load(texturePaths);


const objects = [];
const materialIDs = [];

const g = new THREE.BoxGeometry();
const m = new THREE.MeshBasicMaterial();

const cube1 = new THREE.Mesh(g, m);
objects.push(cube1);
materialIDs.push(0);

const cube2 = new THREE.Mesh(g, m);
cube2.position.set(1.3, 0.4, 0.5);
objects.push(cube2);
materialIDs.push(1);

const g2 = new THREE.BoxGeometry(1,6,4);
const cube3 = new THREE.Mesh(g2, m);
cube3.position.set(-7, 0, 2);
objects.push(cube3);
materialIDs.push(2);

const g3 = new THREE.BoxGeometry(1,1,1);
const cube4 = new THREE.Mesh(g3, m);
cube4.position.set(1, 3, 1);
cube4.rotation.y = Math.PI / 4;
cube4.rotation.x = Math.PI / 5;
objects.push(cube4);
materialIDs.push(2);


var planeGeometry = new THREE.PlaneGeometry(10, 10); 
var plane1 = new THREE.Mesh(planeGeometry, m);
plane1.position.set(0,0,0.1);
objects.push(plane1);
materialIDs.push(3);

var plane2 = new THREE.Mesh(planeGeometry, m);
plane2.position.set(0,-2,4);
plane2.rotation.x = -3 * Math.PI / 4;
objects.push(plane2);
materialIDs.push(3);

//shininess 0 = mirror, 1 = mat

const RayTracingmaterials = [
    { emissionColor: new THREE.Vector3(0  ,0  ,0), color: new THREE.Vector3(0.7, 1, 0.7), shininess: 0.9 },
    { emissionColor: new THREE.Vector3(0.9,0.2,0.3), color: new THREE.Vector3(1, 1, 1), shininess: 0.9 },
    { emissionColor: new THREE.Vector3(0  ,0  ,0), color: new THREE.Vector3(0.9, 1, 0.9), shininess: 0.02 },
    { emissionColor: new THREE.Vector3(0  ,0  ,0), color: new THREE.Vector3(1, 1, 1), shininess: 0.7 }

];



export { textures, objects, materialIDs, RayTracingmaterials, skyboxin };