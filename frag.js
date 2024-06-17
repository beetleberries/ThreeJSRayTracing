export const fragshader = `

uniform vec2 res;
uniform mat4 CamLocalToWorldMat;
uniform vec3 ViewParams;
uniform vec3 CameraWorldSpace;

uniform sampler2D progressiveRenderTexture;
uniform sampler2D customTexture[2];

uniform float time;
uniform int progressiveframecount;


struct Material
{
    vec3 emissionColor;
    vec3 color;
    float shininess;
};

uniform Material materials[4];



uniform sampler2D TriangleTexture;
uniform sampler2D IndexTexture;
uniform sampler2D NormalTexture;
uniform sampler2D UvTexture;

uniform samplerCube SkyboxTexture;
#define NUM_TRIANGLES 62 //draw how many triangles?
#define NUM_BOUNCES 4



struct Ray 
{
    vec3 origin;
    vec3 dir;
};

struct HitInfo
{
    bool hit;
    float dst;
    vec3 point;
    vec3 normal;
    vec2 uv;
    int material;
};

struct Triangle
{
    vec3 v0;
    vec3 v1;
    vec3 v2;
    vec3 normal;
    vec3 uVm0; //uVm m=materialindex
    vec3 uVm1; //uVm m=materialindex
    vec3 uVm2; //uVm m=materialindex
};

struct RandomValue
{
    uint seed;
    float value;
    vec3 vec;
};



HitInfo RayTriangle(Ray ray, Triangle tri) {
    HitInfo hitInfo;
    hitInfo.hit = false;


    vec3 edge1 = tri.v1 - tri.v0;
    vec3 edge2 = tri.v2 - tri.v0;

    vec3 h = cross(ray.dir, edge2);
    float a = dot(edge1, h);

    if (a > -0.00001 && a < 0.00001) // Ray is parallel to the triangle
        return hitInfo;

    float f = 1.0 / a;
    vec3 s = ray.origin - tri.v0;
    float u = f * dot(s, h);
    if (u < 0.0 || u > 1.0)
        return hitInfo;

    vec3 q = cross(s, edge1);
    float v = f * dot(ray.dir, q);
    if (v < 0.0 || u + v > 1.0)
        return hitInfo;

    float t = f * dot(edge2, q);
    if (t > 0.00001) { // ray intersection

        // Check if the triangle is facing away from the ray
        vec3 normal = tri.normal;  // Assuming tri.normal is already normalized
        if (dot(ray.dir, normal) > 0.0) {
            return hitInfo;  // Triangle is facing away
        }

        hitInfo.hit = true;
        hitInfo.dst = t;
        hitInfo.point = ray.origin + ray.dir * t;
        hitInfo.normal = tri.normal;

        // Interpolate UV coordinates at the hit point
        vec2 uv0 = tri.uVm0.xy;
        vec2 uv1 = tri.uVm1.xy;
        vec2 uv2 = tri.uVm2.xy;
        vec2 hitUV = uv0 + u * (uv1 - uv0) + v * (uv2 - uv0);
        hitInfo.uv = hitUV;
        hitInfo.material = int(tri.uVm0.z);
    }

    return hitInfo;

}

HitInfo Trace(Ray ray){
    HitInfo closesthitInfo;
    closesthitInfo.hit = false;
    closesthitInfo.dst = 1000.0;

    for (int i=0; i < NUM_TRIANGLES; i++){
        Triangle tri;
        vec3 face = texelFetch(IndexTexture,ivec2(i,0),0).xyz;

        tri.v0 = texelFetch(TriangleTexture,ivec2(face.x,0),0).xyz;
        tri.v1 = texelFetch(TriangleTexture,ivec2(face.y,0),0).xyz;
        tri.v2 = texelFetch(TriangleTexture,ivec2(face.z,0),0).xyz;
        tri.normal = texelFetch(NormalTexture,ivec2(face.x,0),0).xyz;

        tri.uVm0 = texelFetch(UvTexture,ivec2(face.x,0),0).xyz;
        tri.uVm1 = texelFetch(UvTexture,ivec2(face.y,0),0).xyz;
        tri.uVm2 = texelFetch(UvTexture,ivec2(face.z,0),0).xyz;


        
        HitInfo hitInfo = RayTriangle(ray, tri);
        if (hitInfo.hit){
            if (hitInfo.dst < closesthitInfo.dst){
                closesthitInfo = hitInfo;
            }
        }
    }
    return closesthitInfo;
}



vec3 environment(Ray ray){
    return texture(SkyboxTexture, ray.dir).rgb;
    if (sign(ray.dir.y) > 0.0){
        return mix(vec3(0.3,0.4,0.7),vec3(0.9),ray.dir.y);
    }
    return mix(vec3(0.4),vec3(0.1),-ray.dir.y);
}

vec3 specular_reflect(vec3 I, vec3 N)
{
    return I - 2.0 * dot(I, N) * N;
}

RandomValue Rand(RandomValue r){
    r.seed = r.seed * uint(747796405) + uint(2891336453);
    uint result = ((r.seed >> ((r.seed >> uint(28)) + uint(4))) ^ r.seed) * uint(277803737);
    result = (result >> uint(22)) ^ result;
    r.value =  float(result) / 4294967295.0;
    return r;
}

RandomValue RandomValueNormalDistribution(RandomValue r){
    r = Rand(r);
    float theta = 2.0 * 3.1415926 * r.value;
    r = Rand(r);
    float rho = sqrt(-2.0 * log(r.value));
    r.value = rho * cos(theta);
    return r;
}

RandomValue RandomSphereDir(RandomValue r){

    r = RandomValueNormalDistribution(r);
    r.vec.x = r.value;
    r = RandomValueNormalDistribution(r);
    r.vec.y = r.value;
    r = RandomValueNormalDistribution(r);
    r.vec.z = r.value;

    r.vec = normalize(r.vec);
    return r;
}



void main() {

    vec2 pixel = gl_FragCoord.xy / res.xy;
    vec3 viewPointLocal = vec3(pixel.xy - 0.5, 1) * ViewParams;
    vec4 viewPointWorld = CamLocalToWorldMat * vec4(viewPointLocal, 1);

    Ray ray;
    ray.origin = CameraWorldSpace;
    ray.dir = normalize(viewPointWorld.xyz - ray.origin);


    vec3 color;

    vec3 raycolor = vec3(1.0);
    vec3 incominglight = vec3(0.0);

    RandomValue randomvalue;
    randomvalue.seed = uint(gl_FragCoord.x * 540.0 + gl_FragCoord.y) * uint(time);
    randomvalue = Rand(randomvalue);

    for (int i=0; i < NUM_BOUNCES; i++){
        
        HitInfo hitInfo = Trace(ray);
    
        if (!hitInfo.hit) {
            incominglight += environment(ray) * raycolor;
            break;
        }

        Material material = materials[hitInfo.material];
        vec3 materialcolor = material.color;

        if (hitInfo.material == 0){
            materialcolor *= texture2D(customTexture[0], hitInfo.uv).rbg;
        }
        if (hitInfo.material == 1){
            materialcolor *= texture2D(customTexture[1], hitInfo.uv).rbg;
        }        

        //materialcolor = texture2D(customTexture[hitInfo.material], hitInfo.uv).rbg;
        
        incominglight += material.emissionColor * raycolor;
        raycolor *= materialcolor;
        
        ray.origin = hitInfo.point;
        vec3 spec = specular_reflect(ray.dir, normalize(hitInfo.normal));
        randomvalue =  RandomSphereDir(randomvalue);
        randomvalue.vec = normalize(randomvalue.vec + hitInfo.normal);
        ray.dir = mix(spec, randomvalue.vec,material.shininess);

    }

    color = incominglight;
    
    vec3 average = texture2D( progressiveRenderTexture, pixel ).rgb;

    color = (average * float(progressiveframecount) + color) / float(progressiveframecount + 1);
    gl_FragColor = vec4(color, 1);
  
}

`;