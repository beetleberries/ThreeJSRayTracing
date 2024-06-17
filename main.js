import { fragshader } from './frag.js';

import { textures, objects, materialIDs, RayTracingmaterials, skyboxin } from './scenes/scene1.js';

var width = 960;
var height = 540;

var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 0, 1 );
scene.add(camera);
const renderer = new THREE.WebGLRenderer();
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );




//progressiverender

var pingpong = true;
//setup display scene and pingpong texture for progressiverender
var showscene = new THREE.Scene();
var renderTarget1 = new THREE.WebGLRenderTarget( width, height);
var renderTarget2 = new THREE.WebGLRenderTarget( width, height);

//setup material and quad to display a render texture in the showscene
var showmaterial = new THREE.MeshBasicMaterial({
    map: renderTarget2.texture
});
var showgeometry = new THREE.PlaneGeometry( width, height );
var showquad = new THREE.Mesh( showgeometry, showmaterial );
showscene.add(showquad);

var progressiveframecount = -1;


function RenderScene(){
    pingpong = !pingpong;
    
    var t = pingpong ? renderTarget1 : renderTarget2

    progressiveframecount += 1;
    material.uniforms['progressiveframecount'].value = progressiveframecount;

    renderer.setRenderTarget(t);
    renderer.render( scene, camera);

    


    material.uniforms.progressiveRenderTexture.value = t.texture;
    showquad.material.map = !pingpong ? renderTarget1.texture : renderTarget2.texture;
}

function ShowScene(){
    renderer.clear();
    //console.log(progressiveframecount);
    RenderScene();

    renderer.setRenderTarget(null);
    renderer.render( showscene, camera );
}

//endprogressiverender


var material = new THREE.ShaderMaterial({
    uniforms: {
        res : { value: new THREE.Vector2(width,height)},
        CamLocalToWorldMat : {value: new THREE.Matrix4()},
        ViewParams : {value: new THREE.Vector3(0,0,0)},
        CameraWorldSpace : {value: new THREE.Vector3(0,0,0)},

        time: { value: 0.0 },

        progressiveframecount: { value: 0},
        progressiveRenderTexture: { type: "t", value: renderTarget1.texture },
        customTexture: { value: textures },
        SkyboxTexture: { value: skyboxin },

        TriangleTexture: {},
        NormalTexture: {},
        IndexTexture: {},
        UvTexture:{},

        materials: { value: [] },//materialuniform



    },
    fragmentShader: fragshader,
})

var geometry = new THREE.PlaneGeometry( width, height);
var quad = new THREE.Mesh( geometry,material );
scene.add(quad);




//materialattributes
material.uniforms.materials.value = RayTracingmaterials;
//endmaterialattributes

GetCombinedMesh();



function RayGenParams( rotationX, rotationY, position)
{
    progressiveframecount = -1;

    var fov = 155;
    var near = 0.1;
    var aspect = height / width;



    var matrix = new THREE.Matrix4();
    matrix.identity();
    var Xrot = new THREE.Matrix4().makeRotationX( rotationX * Math.PI / 180); //UP DOWN
    var Yrot = new THREE.Matrix4().makeRotationY( rotationY * Math.PI / 180); //LEFT RIGHT
    //var position = new THREE.Vector3(10,5,8); //POSITION
    var Pmat = new THREE.Matrix4().makeTranslation(position.x, position.y,position.z);
    matrix.multiply(Pmat);
    matrix.multiply(Yrot);
    matrix.multiply(Xrot);

    var ViewParams = new THREE.Vector3();
    ViewParams.x = Math.tan(fov * 0.5 * Math.PI / 180) * 2 * near
    ViewParams.y = ViewParams.x * aspect;
    ViewParams.z = 1;

    material.uniforms['ViewParams'].value = ViewParams;
    material.uniforms['CamLocalToWorldMat'].value = matrix;
    material.uniforms['CameraWorldSpace'].value = position;
}


function GetCombinedMesh() {
    let combinedVertices = [];
    let combinedIndices = [];
    let combinedNormals = [];
    let combinedUvs = [];

    for (let i = 0; i < objects.length; i++) {
        if (objects[i] instanceof THREE.Mesh) {
            let mesh = objects[i].geometry;

            

            // Concatenate indices
            let indices = mesh.getIndex().array;
            for (let j = 0; j < indices.length; j++) {
                combinedIndices.push(indices[j] + combinedVertices.length / 3);
            }
            
            let position = objects[i].position;

            let rotation = objects[i].rotation.clone();
            //console.log(rotation);

            // Concatenate vertices
            let vertices = mesh.getAttribute('position').array;
            for (let j = 0; j < vertices.length; j += 3) {

                let vertex = new THREE.Vector3(vertices[j], vertices[j + 1], vertices[j + 2]);
                vertex.applyEuler(rotation);
                
                // Adjust vertex position based on the object's position
                vertex.add(position);
                
                // Push modified vertex coordinates
                combinedVertices.push(vertex.x, vertex.y, vertex.z);
            }

            // Concatenate normals
            //let normals = mesh.getAttribute('normal').array;
            //combinedNormals.push(...normals);
            let normals = mesh.getAttribute('normal').array;
            for (let j = 0; j < normals.length; j += 3) {
                // Apply object's rotation to normal
                let normal = new THREE.Vector3(normals[j], normals[j + 1], normals[j + 2]);
                normal.applyEuler(rotation);

                // Push modified normal coordinates
                combinedNormals.push(normal.x, normal.y, normal.z);
            }

            // combine uv
            let uvs = mesh.getAttribute('uv').array;
            for (let j = 0; j < uvs.length; j += 2) {
                combinedUvs.push(uvs[j], uvs[j + 1], materialIDs[i]); // Push UV coordinates followed by object index
            }

        }
    }

    material.uniforms['TriangleTexture'].value = new THREE.DataTexture(new Float32Array(combinedVertices), combinedVertices.length / 3, 1, THREE.RGBFormat, THREE.FloatType);
    material.uniforms['IndexTexture'].value = new THREE.DataTexture(new Float32Array(combinedIndices), combinedIndices.length / 3, 1, THREE.RGBFormat, THREE.FloatType);
    material.uniforms['NormalTexture'].value   = new THREE.DataTexture(new Float32Array(combinedNormals), combinedNormals.length / 3, 1, THREE.RGBFormat, THREE.FloatType);
    material.uniforms['UvTexture'].value = new THREE.DataTexture(new Float32Array(combinedUvs), combinedUvs.length / 3, 1, THREE.RGBFormat, THREE.FloatType);
}

//initial camera location
var cameraX = 21;
var cameraY = 230;
var cameraPos = new THREE.Vector3(45,25,38);
var velocityCam1 = 0.7;
var velocityCam2 = 0.4;


var fpsValue = document.getElementById('fpsValue');
var frames = 0;
var lastTime = performance.now();

function updateLoop() {

    
    moveCameraUpdate();
    
    ShowScene();
    updateFpsCounter();
    requestAnimationFrame( updateLoop );

}

requestAnimationFrame(updateLoop);
RayGenParams(cameraX, cameraY, cameraPos);


function updateFpsCounter(){
    var currentTime = performance.now();
    material.uniforms['time'].value = currentTime / 10;
    frames++;
    if (currentTime >= lastTime + 1000) {
        var fps = Math.round(frames * 1000 / (currentTime - lastTime));
        fpsValue.textContent = fps;
        frames = 0;
        lastTime = currentTime;
    }
}


document.addEventListener('mousemove', onMouseMove, false);

var mouse = new THREE.Vector2();
var prevMouse = new THREE.Vector2();
var mouseDelta = new THREE.Vector2();

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    //console.log(mouse);

    mouseDelta.x = mouse.x - prevMouse.x;
    mouseDelta.y = mouse.y - prevMouse.y;

    console.log('Mouse Delta:', mouseDelta);

    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;

    cameraY += mouseDelta.x * 1 * 180 / Math.PI;
    cameraX -= mouseDelta.y * 1 * 180 / Math.PI;

    cameraX = Math.max(-89, Math.min(89, cameraX));
    RayGenParams(cameraX, cameraY, cameraPos);
}




let shouldUpdateCamera = false;
function moveCameraUpdate() {

    const cameraForward = new THREE.Vector3(0,0,1);//world forward
    cameraForward.applyAxisAngle(new THREE.Vector3(0,1,0), cameraY * Math.PI / 180);

    const cameraRight = new THREE.Vector3().crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();
    

    //rotate cam
    shouldUpdateCamera = false;
    if (keys['ArrowLeft']) {
        cameraY -= 1 * velocityCam1;
        shouldUpdateCamera = true;
    }
    if (keys['ArrowRight']) {
        cameraY += 1 * velocityCam1;
        shouldUpdateCamera = true;
    }
    if (keys['ArrowUp']) {
        cameraX -= 1 * velocityCam1;
        shouldUpdateCamera = true;
    }
    if (keys['ArrowDown']) {
        cameraX += 1 * velocityCam1;
        shouldUpdateCamera = true;
    }

    
 


    //move camera
    if (keys['w']) {
        //cameraPos.z += 1 * velocityCam2;
        cameraPos.addScaledVector(cameraForward, 1 * velocityCam2);
        shouldUpdateCamera = true;
    }
    if (keys['s']) {
        //cameraPos.z -= 1 * velocityCam2;
        cameraPos.addScaledVector(cameraForward, -1 * velocityCam2);
        shouldUpdateCamera = true;
    }
    if (keys['a']) {
        //cameraPos.x += 1 * velocityCam2;
        cameraPos.addScaledVector(cameraRight, 1 * velocityCam2);
        shouldUpdateCamera = true;
    }
    if (keys['d']) {
        //cameraPos.x -= 1 * velocityCam2;
        cameraPos.addScaledVector(cameraRight, -1 * velocityCam2);
        shouldUpdateCamera = true;
    }
    if (keys['Shift']) {

        cameraPos.addScaledVector(new THREE.Vector3(0,1,0), -1 * velocityCam2);
        shouldUpdateCamera = true;
    }
    if (keys['c']) {
        cameraPos.addScaledVector(new THREE.Vector3(0,1,0), 1 * velocityCam2);
        shouldUpdateCamera = true;
    }

    
    if (shouldUpdateCamera) {
        RayGenParams(cameraX, cameraY, cameraPos);
    }

}

//input
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});