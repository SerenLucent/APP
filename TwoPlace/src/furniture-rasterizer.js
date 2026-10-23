// Depth-buffered rendering: coplanar furniture parts never show through doors.
let canvas,gl,program,buffer;
function setup(){
 canvas=document.createElement('canvas');gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});if(!gl)return false;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec3 position;attribute vec4 paint;varying vec4 color;varying vec2 local;void main(){gl_Position=vec4(position,1.0);color=paint;local=position.xy;}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision highp float;varying vec4 color;varying vec2 local;void main(){float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5;float grain=sin(local.x*170.0+sin(local.y*12.0)*4.0)*sin(local.x*57.0+local.y*5.0);float texture=1.0+noise*0.04+color.a*grain*0.11;gl_FragColor=vec4(color.rgb*texture,1.0);}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));buffer=gl.createBuffer();return true;
}
export function furnishingImage(model){
 if(model.image)return model.image;
 if(!canvas){try{if(!setup())return cpuImage(model);}catch{gl=null;return cpuImage(model);}}
 if(!gl||gl.isContextLost())return cpuImage(model);
 const width=420,height=Math.max(100,Math.round(width*model.height/model.width)),x0=-model.anchorX*model.width,y0=-model.anchorY*model.height;
 canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.useProgram(program);
 const all=model.faces.flatMap(f=>f.vertices),min=Math.min(...all.map(p=>p.depth))-1,max=Math.max(...all.map(p=>p.depth))+1,data=[];
 for(const face of model.faces){const n=parseInt(face.color.slice(1),16),color=[(n>>16)/255,((n>>8)&255)/255,(n&255)/255,face.grain?1:0];for(const i of [0,1,2,0,2,3]){const p=face.vertices[i],rgb=parseInt((face.paints?.[i]||face.color).slice(1),16),paint=[(rgb>>16)/255,((rgb>>8)&255)/255,(rgb&255)/255,face.grain?1:0];data.push((p.x-x0)/model.width*2-1,1-(p.y-y0)/model.height*2,1-(p.depth-min)/(max-min)*2,...paint);}}
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,'position'),paint=gl.getAttribLocation(program,'paint');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(paint);gl.vertexAttribPointer(paint,4,gl.FLOAT,false,28,12);gl.drawArrays(gl.TRIANGLES,0,data.length/7);model.image=canvas.toDataURL('image/png');return model.image;
}
function cpuImage(model){
 const surface=document.createElement('canvas'),width=320,height=Math.round(width*model.height/model.width);surface.width=width;surface.height=height;const ctx=surface.getContext('2d'),image=ctx.createImageData(width,height),depth=new Float32Array(width*height).fill(-Infinity),x0=-model.anchorX*model.width,y0=-model.anchorY*model.height;
 for(const face of model.faces){const color=parseInt(face.color.slice(1),16),p=face.vertices.map(v=>({x:(v.x-x0)/model.width*width,y:(v.y-y0)/model.height*height,z:v.depth}));for(const indices of [[0,1,2],[0,2,3]]){
 const [a,b,c]=indices.map(i=>p[i]),area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(area)<1e-8)continue;
 const left=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),right=Math.min(width-1,Math.ceil(Math.max(a.x,b.x,c.x))),top=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),bottom=Math.min(height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/area,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/area,w=1-u-v;if(u<0||v<0||w<0)continue;const z=u*a.z+v*b.z+w*c.z,index=y*width+x;if(z<depth[index])continue;depth[index]=z;const n=index*4,texture=1+Math.sin(x*13.1+y*27.9)*.012;image.data[n]=(color>>16)*texture;image.data[n+1]=((color>>8)&255)*texture;image.data[n+2]=(color&255)*texture;image.data[n+3]=255;}
 }}ctx.putImageData(image,0,0);model.image=surface.toDataURL('image/png');return model.image;
}
