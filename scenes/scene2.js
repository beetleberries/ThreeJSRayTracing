

const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load('./images/catboi.jpg');
const texture2 = textureLoader.load('./images/datbatman.JPG');
const textures = [texture1, texture2];

const objects = [];
const materialIDs = [];

const m = new THREE.MeshBasicMaterial();

const cylinder1 = new THREE.Mesh(new THREE.CylinderGeometry(), m); // Cylinder instead of box
objects.push(cylinder1);
materialIDs.push(0);

const cylinder2 = new THREE.Mesh(new THREE.CylinderGeometry(), m); // Cylinder instead of box
cylinder2.position.set(2.5, 0.4, 0.5);
objects.push(cylinder2);
materialIDs.push(1);


const knotgeo = new THREE.TorusKnotGeometry( 3, 0.6, 20, 5 );
const torusKnot = new THREE.Mesh( knotgeo, m );
torusKnot.position.set(1, 3, 1);
torusKnot.rotation.y = Math.PI / 4;
torusKnot.rotation.x = Math.PI / 5;
objects.push(torusKnot);
materialIDs.push(2);

const planeGeometry = new THREE.PlaneGeometry(10, 10); 
const plane1 = new THREE.Mesh(planeGeometry, m);
plane1.position.set(0, 0, -2.1);
objects.push(plane1);
materialIDs.push(3);

const plane2 = new THREE.Mesh(planeGeometry, m);
plane2.position.set(0, 0, 6);
plane2.rotation.x = -3 * Math.PI / 4;
objects.push(plane2);
materialIDs.push(3);

// Shininess definitions remain the same

const RayTracingmaterials = [
    { emissionColor: new THREE.Vector3(0, 0, 0), color: new THREE.Vector3(0, 0, 1), shininess: 0.9 },
    { emissionColor: new THREE.Vector3(0, 0, 0), color: new THREE.Vector3(0, 0, 1), shininess: 0.9 },
    { emissionColor: new THREE.Vector3(0, 0, 0), color: new THREE.Vector3(0.9, 1, 0.9), shininess: 0.02 },
    { emissionColor: new THREE.Vector3(0, 0, 0), color: new THREE.Vector3(1, 1, 1), shininess: 0.7 }
];

export { textures, objects, materialIDs, RayTracingmaterials };
