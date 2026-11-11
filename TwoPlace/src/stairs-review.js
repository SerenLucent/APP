import {isoScenery,isoFurniture} from './pet-art.js';
import {petImage} from './pet-sprites.js';
import {project,cellCenter} from '../shared/pet-space.js';
import {furnishingModel} from './furnishing-model.js';
import {staircaseArt,stairwellArt,centeredRoomDoors} from './stairs-art.js';
import './stairs-review.css';
const root=document.getElementById('stairs-review');let floor=1;
function background(){
 const doc=new DOMParser().parseFromString(isoScenery('home'),'image/svg+xml'),svg=doc.documentElement;
 svg.removeAttribute('aria-hidden');
 svg.querySelector('.built-in-kitchen')?.remove();
 for(const text of svg.querySelectorAll('text'))if(['모모네방','쿠키네방','거실로'].includes(text.textContent))text.closest('g')?.remove();
 const doors=doc.createElementNS('http://www.w3.org/2000/svg','g');doors.innerHTML=centeredRoomDoors(floor);svg.append(doors);
 const g=doc.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','stair-interaction');g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('data-floor',String(floor===1?2:1));g.setAttribute('aria-label',floor===1?'계단을 눌러 2층으로 올라가기':'계단을 눌러 1층 거실로 내려가기');g.innerHTML=floor===1?staircaseArt():stairwellArt();svg.append(g);
 return new XMLSerializer().serializeToString(svg);
}
function furnishing(product,c,r,rotation=0){
 const p=project(cellCenter(c,r)),m=furnishingModel(product,rotation);if(!m)return '';
 return `<div class="review-furniture ${product==='rug'?'is-rug':''}" style="left:${p.x}%;top:${p.y}%;width:${m.width*44/400}%;aspect-ratio:${m.width}/${m.height};transform:translate(${-m.anchorX*100}%,${-m.anchorY*100}%);z-index:${product==='rug'?1:Math.round(p.y*10)}">${isoFurniture(product,rotation)}</div>`;
}
function pet(id,c,r){const p=project(cellCenter(c,r));return `<div class="review-pet" style="left:${p.x}%;top:${p.y}%;z-index:${Math.round(p.y*10)+2}"><img src="${petImage(id)}" alt="${id==='mochi'?'모모':'쿠키'}"><span>${id==='mochi'?'모모':'쿠키'}</span></div>`;}
function draw(){
 root.innerHTML=`<header class="review-header"><div><span class="review-eyebrow">TWOPLACE · OUR LITTLE HOME</span><h1>거실에서, 한 층 더.</h1><p>포근한 원목 계단으로 이어지는 우리 집</p></div><span class="review-badge">로컬 시안</span></header><section class="review-layout"><div class="review-map-card"><div class="review-map-head"><div><span class="floor-index">${floor}F</span><strong>${floor===1?'우리의 거실':'2층 공용 공간'}</strong></div><nav aria-label="층 선택"><button data-floor="1" aria-pressed="${floor===1}">1층 거실</button><button data-floor="2" aria-pressed="${floor===2}">2층</button></nav></div><div class="review-map"><div class="review-world">${background()}${floor===1?furnishing('rug',8,11)+furnishing('sofa',5,9,90)+furnishing('table',9,11)+furnishing('plant',3,5)+furnishing('bookshelf',11,5):furnishing('rug',12,11)+furnishing('sofa',12,8)+furnishing('table',13,11)+furnishing('bookshelf',8,1)+furnishing('plant',4,3)}${pet('mochi',floor===1?12:8,12)}${pet('kuki',floor===1?13:10,15)}</div></div><p class="review-map-tip">${floor===1?'오른쪽 원목 계단을 눌러 2층으로 올라가 보세요.':'계단 입구를 누르면 1층 거실로 돌아가요.'}</p></div><aside class="review-details"><div class="detail-number">0${floor}</div><h2>${floor===1?'1층은 생활 공간,<br>계단은 작고 가볍게.':'모모와 쿠키의 방은<br>조용한 2층으로.'}</h2><p>${floor===1?'왼쪽 벽 중앙은 화장실, 오른쪽 벽 중앙은 샤워실이에요. 계단을 줄여 벽과 바닥에 더 많은 여백을 남겼어요.':'창문을 비우고 왼쪽 벽 중앙에 모모네방, 오른쪽 벽 중앙에 쿠키네방 문을 옮겼어요.'}</p><div class="material-swatches"><span style="--swatch:#dbb68c">오크</span><span style="--swatch:#f4e5ce">크림</span><span style="--swatch:#c7d3bf">세이지</span></div><p class="review-detail-note">현재 가구와 커플방 저장 데이터는<br>바뀌지 않는 별도 시안이에요.</p><button class="floor-action" data-floor="${floor===1?2:1}">${floor===1?'계단을 올라가 볼까요? ↗':'1층 거실로 돌아가기 ↙'}</button></aside></section>`;
 for(const button of root.querySelectorAll('[data-floor]')){const go=()=>{floor=Number(button.dataset.floor);draw();};button.onclick=go;if(button.tagName.toLowerCase()==='g')button.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};}
}
draw();
