import {dateSpan,eventKinds,categoryNames} from './calendar-model.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountEventEditor({modal,openDialog,event,selected,role,newId,onSave,onDone}){
  const first=event?.date||selected,kind=event?.kind||'general';
  const start=event?.startTime||(kind!=='work'?event?.time:'')||'';
  const end=event?.endTime||(kind==='work'?event?.time:'')||'';
  const option=(name,value,label,checked)=>`<label class="category-option"><input type="radio" name="${name}" value="${value}" ${checked?'checked':''}><span>${label}</span></label>`;
  openDialog(event?'일정 수정하기':'우리의 새 일정',`<form class="event-form">
    <div class="date-caption"><label for="event-date">날짜</label><button type="button" class="period-button">기간 등록</button></div>
    <div class="dates-row"><label class="date-box"><span class="date-start-caption" hidden>시작일</span><input id="event-date" name="date" type="date" value="${first}" required></label><label class="date-box end-date" hidden><span>종료일</span><input name="endDate" type="date" value="${first}" required disabled></label></div>
    <div class="category-caption"><span>카테고리</span><label class="period-copy" hidden><input name="uniform" type="checkbox" checked>설정기간 동일적용</label></div>
    <div class="daily-editor" hidden><label for="daily-date">날짜별 입력</label><select id="daily-date" name="dailyDate"></select><p class="muted">날짜를 골라 각각 입력해요. 작성한 날짜만 저장돼요.</p></div>
    <fieldset class="category-picker"><legend class="sr-only">카테고리</legend>${eventKinds.map(k=>option('kind',k,categoryNames[k],k===kind)).join('')}</fieldset>
    <div class="event-fields work-fields"><fieldset class="work-picker"><legend>일정 종류</legend>${option('workType','shift','근무',event?.workType!=='off')}${option('workType','off','휴무',event?.workType==='off')}</fieldset></div>
    <div class="event-fields title-fields"><label for="title">일정 이름</label><input id="title" name="title" maxlength="100" value="${esc(event?.title||'')}" placeholder="예: 저녁 약속"></div>
    <div class="time-range"><div class="time-box"><label class="time-toggle"><input type="checkbox" name="hasStart" ${start?'checked':''}><span>시작시간</span></label><input aria-label="시작시간" type="time" name="startTime" value="${start}"></div><span class="time-separator">~</span><div class="time-box"><label class="time-toggle"><input type="checkbox" name="hasEnd" ${end?'checked':''}><span>종료시간</span></label><input aria-label="종료시간" type="time" name="endTime" value="${end}"></div></div>
    <div class="event-fields place-fields"><label for="event-place">갈 곳</label><input id="event-place" name="place" maxlength="200" value="${esc(event?.place||'')}" placeholder="예: 성수동 카페, 한강 산책"></div>
    <div class="event-fields"><label for="event-details">메모 / 계획</label><textarea id="event-details" name="details" rows="4" maxlength="5000">${esc(event?.details||'')}</textarea></div>
    <p class="form-error" role="alert"></p><button class="primary" type="submit">일정 저장하기</button></form>`);
  const form=modal.querySelector('form'),f=form.elements,error=form.querySelector('[role="alert"]');
  let period=false,activeDate=first;const drafts=new Map();
  function collect(){
    const k=f.kind.value,off=k==='work'&&f.workType.value==='off';
    return {kind:k,workType:f.workType.value,title:f.title.value.trim(),startTime:!off&&f.hasStart.checked?f.startTime.value:'',endTime:!off&&f.hasEnd.checked?f.endTime.value:'',place:f.place.value.trim(),details:f.details.value.trim()};
  }
  function update(){
    const work=f.kind.value==='work',off=work&&f.workType.value==='off';
    form.querySelector('.work-fields').hidden=!work;form.querySelector('.title-fields').hidden=work;f.title.disabled=work;f.title.required=f.kind.value==='general';
    form.querySelector('label[for="title"]').textContent=f.kind.value==='trip'?'여행 이름':f.kind.value==='date'?'데이트 이름':'일정 이름';
    form.querySelector('.place-fields').hidden=f.kind.value!=='date';
    form.querySelector('.time-range').hidden=off;
    f.startTime.disabled=off||!f.hasStart.checked;f.endTime.disabled=off||!f.hasEnd.checked;
    f.startTime.required=!f.startTime.disabled;f.endTime.required=!f.endTime.disabled;
    const names=work?['출근시간','퇴근시간']:['시작시간','종료시간'];
    form.querySelectorAll('.time-toggle span').forEach((s,i)=>s.textContent=names[i]);
    f.startTime.setAttribute('aria-label',names[0]);f.endTime.setAttribute('aria-label',names[1]);
  }
  function fill(d={kind:'general',workType:'shift',title:'',startTime:'',endTime:'',place:'',details:''}){
    f.kind.value=d.kind;f.workType.value=d.workType;for(const k of ['title','startTime','endTime','place','details'])f[k].value=d[k]||'';
    f.hasStart.checked=!!d.startTime;f.hasEnd.checked=!!d.endTime;update();
  }
  function rebuildDates(){
    f.endDate.disabled=!period;form.querySelector('.end-date').hidden=!period;form.querySelector('.date-start-caption').hidden=!period;form.querySelector('.period-copy').hidden=!period;
    form.querySelector('.dates-row').classList.toggle('is-range',period);
    form.querySelector('.daily-editor').hidden=!period||f.uniform.checked;
    if(!period)return;
    try{
      const dates=dateSpan(f.date.value,f.endDate.value);error.textContent='';
      f.dailyDate.innerHTML=dates.map(d=>`<option value="${d}">${d}</option>`).join('');
      if(!dates.includes(activeDate))activeDate=dates[0];f.dailyDate.value=activeDate;
    }catch(e){error.textContent=e.message;}
  }
  form.querySelector('.period-button').onclick=()=>{period=!period;form.querySelector('.period-button').textContent=period?'하루 등록':'기간 등록';if(f.endDate.value<f.date.value)f.endDate.value=f.date.value;rebuildDates();};
  form.onchange=e=>{
    if(e.target===f.dailyDate){drafts.set(activeDate,collect());activeDate=f.dailyDate.value;fill(drafts.get(activeDate));return;}
    if(['date','endDate','uniform'].includes(e.target.name)){drafts.set(activeDate,collect());if(e.target===f.date&&f.endDate.value<f.date.value)f.endDate.value=f.date.value;rebuildDates();}
    update();
  };
  update();rebuildDates();
  form.onsubmit=async e=>{
    e.preventDefault();const button=form.querySelector('[type="submit"]');
    try{
      const dates=period?dateSpan(f.date.value,f.endDate.value):[f.date.value];
      let rows;
      if(period&&!f.uniform.checked){drafts.set(activeDate,collect());rows=dates.filter(d=>drafts.has(d)).map(d=>[d,drafts.get(d)]).filter(([,d])=>d.kind!=='general'||d.title);}
      else rows=dates.map(d=>[d,collect()]);
      if(!rows.length)throw new Error('등록할 날짜의 일정을 입력해 주세요.');
      const entries=rows.map(([date,d])=>{
        const title=d.kind==='work'?(d.workType==='off'?'휴무':'근무'):d.title||(d.kind==='trip'?'여행':d.kind==='date'?'데이트':'');
        if(!title)throw new Error('일정 이름을 적어 주세요.');
        return {id:event&&date===event.date?event.id:newId(),date,title,kind:d.kind,time:'',startTime:d.startTime,endTime:d.endTime,place:d.kind==='date'?d.place:'',details:d.details,authorRole:event&&date===event.date?(event.authorRole||role):role,...(d.kind==='work'?{workType:d.workType}:{})};
      });
      button.disabled=true;if(await onSave(entries))onDone(entries);
    }catch(e){error.textContent=e.message;}finally{button.disabled=false;}
  };
}
