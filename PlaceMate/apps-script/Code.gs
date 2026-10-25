// GENERATED: paste this complete file into the PlaceMate Apps Script project.
/**
 * PlaceMate JSON backend using the same APP repository as TwoPlace.
 * Required script property: GITHUB_TOKEN.
 * Defaults: SerenLucent/APP, branch main. Optional property overrides supported.
 * All data is restricted to PlaceMate/. Public repositories are supported.
 * No credentials belong in frontend JavaScript or repository files.
 */
var PM_ROOT_ = 'PlaceMate/';

function doGet(e) {
  if(e&&e.parameter&&e.parameter.action==='mapConfig')return json_({ok:true,data:pmNaverConfig_()});
  var cfg=config_();
  return json_({ok:true, service:'PlaceMate', storage:'github-json', repository:cfg.owner+'/'+cfg.repo, branch:cfg.branch, prefix:PM_ROOT_, version:3});
}

/** Verify the token and branch using the same repository settings as TwoPlace. */
function setupPlaceMate() {
  var cfg=config_();
  var repository=github_(cfg, 'get', '');
  assert_(!repository.permissions || repository.permissions.push !== false, 'GITHUB_ACCESS_DENIED');
  github_(cfg, 'get', '/git/ref/heads/'+cfg.branch.split('/').map(encodeURIComponent).join('/'));
  return 'PlaceMate GitHub storage is ready: '+cfg.owner+'/'+cfg.repo+' ('+cfg.branch+'), prefix '+PM_ROOT_;
}

function doPost(e) {
  try {
    assert_(e && e.postData && e.postData.contents.length <= 400000, 'BAD_REQUEST');
    return json_(placeMateApi(JSON.parse(e.postData.contents)));
  } catch (error) {
    return json_({ok:false, error:error.pmCode || 'BAD_REQUEST'});
  }
}

/** Also callable from an Apps Script HTML-service page via google.script.run. */
function placeMateApi(request) {
  var lock = LockService.getScriptLock();
  try {
    assert_(lock.tryLock(15000), 'BUSY');
    assert_(request && typeof request === 'object', 'BAD_REQUEST');
    assert_(/^[a-f0-9]{64}$/.test(request.personalKey || ''), 'INVALID_PERSONAL_KEY');
    var uid = 'u_' + hexDigest_(request.personalKey);
    var cfg = config_();
    var tx = transaction_(cfg);
    var input = request.payload || {};
    var result = dispatch_(tx, uid, request.action, input);
    tx.commit('PlaceMate: ' + request.action);
    return {ok:true, data:result};
  } catch (error) {
    return {ok:false, error:error.pmCode || 'SERVER_ERROR'};
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function config_() {
  var p = PropertiesService.getScriptProperties();
  var owner = p.getProperty('GITHUB_OWNER') || 'SerenLucent';
  var repo = p.getProperty('GITHUB_REPO') || 'APP';
  var token = p.getProperty('GITHUB_TOKEN');
  var branch = p.getProperty('GITHUB_BRANCH') || 'main';
  assert_(token && /^[\w-]+$/.test(owner || '') && /^[\w.-]+$/.test(repo), 'CONFIG_REQUIRED');
  assert_(/^[\w./-]+$/.test(branch), 'INVALID_BRANCH');
  return {owner:owner, repo:repo, token:token, branch:branch};
}

function github_(cfg, method, suffix, body, allow404) {
  var options = {method:method, muteHttpExceptions:true, headers:{
    Authorization:'Bearer ' + cfg.token, Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'
  }};
  if (body !== undefined) { options.contentType = 'application/json'; options.payload = JSON.stringify(body); }
  var response = UrlFetchApp.fetch('https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + suffix, options);
  var code = response.getResponseCode();
  if (allow404 && code === 404) return null;
  if (code === 409 || code === 422) fail_('GITHUB_CONFLICT');
  if (code === 401 || code === 403) fail_('GITHUB_ACCESS_DENIED');
  assert_(code >= 200 && code < 300, 'GITHUB_ERROR');
  return JSON.parse(response.getContentText());
}

/** Immutable reads from one commit, one atomic tree/commit/ref update per command.
 * Script lock serializes this deployment; non-force ref update detects other writers.
 */
function transaction_(cfg) {
  var ref = github_(cfg, 'get', '/git/ref/heads/' + cfg.branch.split('/').map(encodeURIComponent).join('/'));
  var head = ref.object.sha;
  var base = github_(cfg, 'get', '/git/commits/' + head);
  var cache = Object.create(null), writes = Object.create(null);
  return {
    read:function(path) {
      assert_(path.indexOf(PM_ROOT_) === 0 && path.indexOf('..') < 0, 'INVALID_PATH');
      if (Object.prototype.hasOwnProperty.call(cache, path)) return cache[path];
      var file = github_(cfg, 'get', '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + head, undefined, true);
      var result = null;
      if (file) {
        assert_(file.encoding === 'base64', 'FILE_TOO_LARGE');
        result = JSON.parse(Utilities.newBlob(Utilities.base64Decode(file.content.replace(/\s/g, ''))).getDataAsString('UTF-8'));
      }
      cache[path] = result;
      return result;
    },
    write:function(path, value) {
      assert_(path.indexOf(PM_ROOT_) === 0 && path.indexOf('..') < 0, 'INVALID_PATH');
      cache[path] = value; writes[path] = value;
    },
    commit:function(message) {
      var files = Object.keys(writes);
      if (!files.length) return;
      var entries = files.map(function(path) {return {path:path, mode:'100644', type:'blob', content:JSON.stringify(writes[path], null, 2) + '\n'};});
      var tree = github_(cfg, 'post', '/git/trees', {base_tree:base.tree.sha, tree:entries});
      var commit = github_(cfg, 'post', '/git/commits', {message:message, tree:tree.sha, parents:[head]});
      github_(cfg, 'patch', '/git/refs/heads/' + cfg.branch.split('/').map(encodeURIComponent).join('/'), {sha:commit.sha, force:false});
    }
  };
}

function userPath_(uid) { assert_(/^u_[a-f0-9]{64}$/.test(uid), 'INVALID_USER'); return PM_ROOT_ + 'users/' + uid + '/personal.json'; }
function roomPath_(code, file) { assert_(/^[A-F0-9]{12}$/.test(code || ''), 'INVALID_ROOM_KEY'); return PM_ROOT_ + 'rooms/' + code + '/' + file + '.json'; }
function personal_(tx, uid) { var p = tx.read(userPath_(uid)); assert_(p, 'ACCOUNT_NOT_FOUND'); return p; }
function room_(tx, code) { var r = tx.read(roomPath_(code, 'room')); assert_(r, 'ROOM_NOT_FOUND'); return r; }
function member_(r, uid) { assert_(r.members.indexOf(uid) >= 0 && r.bans.indexOf(uid) < 0, 'NOT_A_MEMBER'); }
function master_(r, uid) { member_(r, uid); assert_(r.masterId === uid, 'MASTER_ONLY'); }
function revision_(obj, version) { assert_(Number.isInteger(version) && obj.revision === version, 'STALE_REVISION'); }
function touch_(tx, p) { p.revision++; p.updatedAt = new Date().toISOString(); tx.write(userPath_(p.id), p); }
function writeRoom_(tx, r) { r.revision++; r.updatedAt = new Date().toISOString(); tx.write(roomPath_(r.key, 'room'), r); mergeRoom_(tx, r); }

/** Rebuild only from current approved members and their explicitly selected originals. */
function mergeRoom_(tx, r) {
  var records = [], profiles = [], people = [], canonical = Object.create(null);
  r.members.forEach(function(uid) {
    var p = personal_(tx, uid);
    profiles.push({id:uid, nickname:p.nickname}); people.push(p);
    var shared = r.shares[uid] || [];
    p.places.forEach(function(place) {
      if (shared.indexOf(place.id) >= 0) {
        records.push(Object.assign({}, place, {ownerId:uid})); canonical[place.canonicalId] = true;
      }
    });
  });
  var visits = [];
  people.forEach(function(p) {
    p.visits.forEach(function(v) { if (canonical[v.canonicalId]) visits.push(Object.assign({}, v, {userId:p.id})); });
  });
  var merged = {schemaVersion:1, key:r.key, revision:r.revision, updatedAt:r.updatedAt, members:profiles, places:records, visits:visits};
  tx.write(roomPath_(r.key, 'merged'), merged);
  return merged;
}

function roomView_(r, uid) {
  member_(r, uid);
  var view = {key:r.key, name:r.name, description:r.description, revision:r.revision, masterId:r.masterId, members:r.members, sharedPlaceIds:r.shares[uid] || [], updatedAt:r.updatedAt};
  if (r.masterId === uid) {view.pending=r.pending; view.bans=r.bans;}
  return view;
}

function dispatch_(tx, uid, action, data) {
  var p, r, other;
  if (action === 'register') {
    assert_(!tx.read(userPath_(uid)), 'ACCOUNT_EXISTS');
    p = {schemaVersion:1, id:uid, nickname:text_(data.nickname, 20, true), revision:1, places:[], visits:[], roomKeys:[], pendingRoomKeys:[], updatedAt:new Date().toISOString()};
    tx.write(userPath_(uid), p); return p;
  }
  p = personal_(tx, uid);
  switch (action) {
    case 'searchPlaces': return pmNaverSearch_(data.query,uid);
    case 'getPersonal': return Object.assign({},p,{mapFeatures:2});
    case 'savePersonal':
      revision_(p, data.expectedRevision);
      p.nickname = text_(data.nickname, 20, true);
      p.places = validatePlaces_(data.places);
      p.visits = validateVisits_(data.visits);
      touch_(tx, p);
      p.roomKeys.forEach(function(key) {
        var room = room_(tx, key);
        member_(room, uid);
        // Delete stale references when a personal original is deleted.
        room.shares[uid] = (room.shares[uid] || []).filter(function(id) {return p.places.some(function(place) {return place.id === id;});});
        writeRoom_(tx, room);
      });
      return p;
    case 'createRoom':
      assert_(p.roomKeys.length < 30, 'TOO_MANY_ROOMS');
      var key = Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
      assert_(!tx.read(roomPath_(key, 'room')), 'ROOM_KEY_COLLISION');
      r = {schemaVersion:1, key:key, name:text_(data.name, 40, true), description:text_(data.description, 200), masterId:uid, members:[uid], pending:[], bans:[], shares:{}, revision:0};
      r.shares[uid] = []; p.roomKeys.push(key); touch_(tx, p); writeRoom_(tx, r);
      return {personal:p, room:roomView_(r, uid)};
    case 'getRoom':
      r = room_(tx, data.roomKey); member_(r, uid);
      var result = {room:roomView_(r, uid), merged:tx.read(roomPath_(r.key, 'merged'))};
      if (r.masterId === uid) result.pendingProfiles = r.pending.map(function(id) {var requester=personal_(tx, id); return {id:requester.id, nickname:requester.nickname};});
      return result;
    case 'requestJoin':
      r = room_(tx, data.roomKey);
      assert_(r.bans.indexOf(uid) < 0, 'BANNED');
      assert_(r.members.indexOf(uid) < 0, 'ALREADY_MEMBER');
      assert_(r.pending.indexOf(uid) < 0, 'ALREADY_PENDING');
      assert_(p.roomKeys.length + p.pendingRoomKeys.length < 30, 'TOO_MANY_ROOMS');
      assert_(r.pending.length < 100, 'TOO_MANY_REQUESTS');
      r.pending.push(uid); p.pendingRoomKeys.push(r.key); touch_(tx, p);
      writeRoom_(tx, r); return {status:'pending', personal:p};
    case 'share':
      r = room_(tx, data.roomKey); member_(r, uid); revision_(r, data.expectedRevision);
      var ids = identifiers_(data.placeIds, 1000);
      assert_(ids.every(function(id) {return p.places.some(function(place) {return place.id === id;});}), 'NOT_YOUR_PLACE');
      r.shares[uid] = ids; writeRoom_(tx, r);
      return {room:roomView_(r, uid), merged:tx.read(roomPath_(r.key, 'merged'))};
    case 'approve': case 'reject': case 'ban': case 'unban': case 'transfer':
      r = room_(tx, data.roomKey); master_(r, uid); revision_(r, data.expectedRevision);
      other = personal_(tx, data.userId);
      assert_(other.id !== uid, 'CANNOT_TARGET_SELF');
      if (action === 'approve') {
        assert_(r.pending.indexOf(other.id) >= 0 && r.bans.indexOf(other.id) < 0, 'INVALID_REQUEST');
        assert_(r.members.length < 50 && other.roomKeys.length < 30, 'ROOM_LIMIT');
        r.pending = without_(r.pending, other.id); r.members.push(other.id); r.shares[other.id] = [];
        other.pendingRoomKeys = without_(other.pendingRoomKeys, r.key); other.roomKeys.push(r.key); touch_(tx, other);
      } else if (action === 'reject') {
        assert_(r.pending.indexOf(other.id) >= 0, 'INVALID_REQUEST');
        r.pending = without_(r.pending, other.id); other.pendingRoomKeys = without_(other.pendingRoomKeys, r.key); touch_(tx, other);
      } else if (action === 'ban') {
        assert_(r.members.indexOf(other.id) >= 0 || r.pending.indexOf(other.id) >= 0, 'INVALID_TARGET');
        r.members = without_(r.members, other.id); r.pending = without_(r.pending, other.id);
        if (r.bans.indexOf(other.id) < 0) r.bans.push(other.id);
        delete r.shares[other.id]; other.roomKeys = without_(other.roomKeys, r.key); other.pendingRoomKeys = without_(other.pendingRoomKeys, r.key); touch_(tx, other);
      } else if (action === 'unban') {
        assert_(r.bans.indexOf(other.id) >= 0, 'NOT_BANNED'); r.bans = without_(r.bans, other.id);
      } else {
        member_(r, other.id); r.masterId = other.id;
      }
      writeRoom_(tx, r); return {room:roomView_(r, uid)};
    case 'leave':
      r = room_(tx, data.roomKey); member_(r, uid); revision_(r, data.expectedRevision);
      assert_(r.masterId !== uid, 'TRANSFER_BEFORE_LEAVE');
      r.members = without_(r.members, uid); delete r.shares[uid];
      p.roomKeys = without_(p.roomKeys, r.key); touch_(tx, p); writeRoom_(tx, r); return {personal:p};
    default: fail_('UNKNOWN_ACTION');
  }
}

function validatePlaces_(input) {
  assert_(Array.isArray(input) && input.length <= 1000, 'INVALID_PLACES');
  var ids = Object.create(null);
  return input.map(function(p) {
    var id = id_(p.id); assert_(!ids[id], 'DUPLICATE_PLACE'); ids[id]=true;
    assert_(Number.isFinite(p.lat) && p.lat >= -85 && p.lat <= 85 && Number.isFinite(p.lng) && p.lng >= -180 && p.lng <= 180, 'INVALID_COORDINATES');
    return {id:id, canonicalId:id_(p.canonicalId), name:text_(p.name, 100, true), address:text_(p.address, 250), category:text_(p.category, 30, true), lat:p.lat, lng:p.lng, checkedAt:date_(p.checkedAt), wanted:p.wanted===true};
  });
}

function validateVisits_(input) {
  assert_(Array.isArray(input) && input.length <= 3000, 'INVALID_VISITS');
  var seen = Object.create(null);
  return input.map(function(v) {
    var canonicalId = id_(v.canonicalId); assert_(!seen[canonicalId], 'DUPLICATE_VISIT'); seen[canonicalId]=true;
    assert_(v.visited === true, 'VISIT_REQUIRED');
    assert_(Array.isArray(v.custom) && v.custom.length <= 20, 'INVALID_RATINGS');
    var labels = Object.create(null);
    return {canonicalId:canonicalId, visited:true, visitedAt:date_(v.visitedAt), rating:score_(v.rating, true), comment:text_(v.comment, 500), custom:v.custom.map(function(c) {
      var label = text_(c.label, 30, true); assert_(!labels[label], 'DUPLICATE_RATING'); labels[label]=true;
      return {label:label, score:score_(c.score, false)};
    })};
  });
}

function id_(value) { assert_(typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value), 'INVALID_ID'); return value; }
function identifiers_(value, max) { assert_(Array.isArray(value) && value.length <= max, 'INVALID_IDS'); var seen=Object.create(null); return value.map(function(id) {id=id_(id); assert_(!seen[id], 'DUPLICATE_ID'); seen[id]=true; return id;}); }
function score_(n, optional) {if (optional && n === null) return null; assert_(Number.isInteger(n) && n >= 1 && n <= 5, 'INVALID_SCORE'); return n;}
function date_(value) {if (value == null || value === '') return null; assert_(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)), 'INVALID_DATE'); return value;}
function text_(s, max, required) {assert_(s == null || typeof s === 'string', 'INVALID_TEXT'); var result=(s || '').trim(); assert_(result.length <= max && (!required || result.length > 0), 'INVALID_TEXT'); return result;}
function without_(array, value) {return array.filter(function(v) {return v !== value;});}
function hexDigest_(value) {return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8).map(function(b) {return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');}
function assert_(condition, code) {if (!condition) fail_(code);}
function fail_(code) {var error=new Error(code); error.pmCode=code; throw error;}
function json_(value) {return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}

/** Shared by PlaceMate and TwoPlace. Only the map browser ID is returned to clients. */
function pmNaverConfig_(){
  var props=PropertiesService.getScriptProperties();
  return {provider:'naver',mapClientId:props.getProperty('NAVER_MAP_CLIENT_ID')||'',searchReady:!!(props.getProperty('NAVER_SEARCH_CLIENT_ID')&&props.getProperty('NAVER_SEARCH_CLIENT_SECRET'))};
}
function pmNaverFail_(code){var e=new Error(code);e.pmCode=code;e.status=code==='NAVER_SEARCH_RATE_LIMIT'?429:503;throw e;}
function pmNaverText_(text){return String(text||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();}
function pmNaverSearch_(input,identity){
  if(typeof input!=='string'||input.trim().length<2||input.length>100)pmNaverFail_('INVALID_SEARCH_QUERY');
  var query=input.trim(),props=PropertiesService.getScriptProperties();
  var id=props.getProperty('NAVER_SEARCH_CLIENT_ID'),secret=props.getProperty('NAVER_SEARCH_CLIENT_SECRET');
  if(!id||!secret)pmNaverFail_('NAVER_SEARCH_NOT_CONFIGURED');
  var cache=CacheService.getScriptCache();
  var countKey='pm-nav-rate:'+identity+':'+Math.floor(Date.now()/60000);
  var count=Number(cache.get(countKey)||0);if(count>=15)pmNaverFail_('NAVER_SEARCH_RATE_LIMIT');cache.put(countKey,String(count+1),120);
  // Application-local daily cap; the provider console remains the authoritative limit.
  var today=Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd');
  var counter=JSON.parse(props.getProperty('PM_NAVER_SEARCH_USAGE')||'null');
  if(!counter||counter.date!==today)counter={date:today,count:0};
  var limit=Number(props.getProperty('NAVER_SEARCH_DAILY_LIMIT')||1000);
  if(!Number.isFinite(limit)||limit<1||counter.count>=limit)pmNaverFail_('NAVER_SEARCH_DAILY_LIMIT');
  counter.count++;props.setProperty('PM_NAVER_SEARCH_USAGE',JSON.stringify(counter));
  var response=UrlFetchApp.fetch('https://naverapihub.apigw.ntruss.com/search/v1/local?query='+encodeURIComponent(query)+'&display=5&start=1&sort=random&format=json',{
    method:'get',muteHttpExceptions:true,headers:{'X-NCP-APIGW-API-KEY-ID':id,'X-NCP-APIGW-API-KEY':secret}
  });
  var status=response.getResponseCode();
  if(status===401||status===403)pmNaverFail_('NAVER_SEARCH_AUTH_FAILED');
  if(status===429)pmNaverFail_('NAVER_SEARCH_RATE_LIMIT');
  if(status!==200)pmNaverFail_('NAVER_SEARCH_FAILED');
  var result=JSON.parse(response.getContentText());
  return {source:'NAVER',query:query,items:(result.items||[]).slice(0,5).map(function(item){
    var lng=Number(item.mapx),lat=Number(item.mapy);
    // NAVER returns WGS84 either as decimal degrees or scaled integers (1e7).
    if(Math.abs(lng)>180)lng/=10000000;if(Math.abs(lat)>90)lat/=10000000;
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>85||Math.abs(lng)>180||(!lat&&!lng))return null;
    var name=pmNaverText_(item.title),address=pmNaverText_(item.roadAddress||item.address),raw=pmNaverText_(item.category);
    var category=/카페|커피|디저트|베이커리/.test(raw)?'카페':/음식|식당|요리|한식|양식|중식|일식|술집/.test(raw)?'맛집':'기타';
    var identityText=JSON.stringify([name,address,lat,lng]);
    var digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,identityText,Utilities.Charset.UTF_8).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
    return {canonicalId:'naver_'+digest,name:name,address:address,category:category,lat:lat,lng:lng};
  }).filter(function(item){return item&&item.name&&item.address;})};
}
