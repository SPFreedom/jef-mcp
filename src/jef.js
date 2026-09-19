// Jef. The entire model. A System Zero Model by TypoSafe AI (typesafe.lol).
// Jef never writes a sentence. Jef only picks from what you gave it, scores it,
// or says yes or no — with confidence. Same input, same answer, forever.
// Shared by the page (plain script) and the share/OG functions (imported for its side effect).
(function(g){
  var MODEL='jef-0.1';
  function hash(s){ var h=2166136261>>>0; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h; }
  function norm(s){ return String(s==null?'':s).replace(/\s+/g,' ').trim(); }

  // Jef escalates. Anything that should go to a human goes to a human. Confidence 0.
  // Jef escalates. Anything where a confident coin-flip could do real damage returns
  // ESCALATED TO A HUMAN at confidence 0. Deliberately over-broad: we would rather
  // refuse a hundred jokes than answer one real crisis. Grouped so it stays readable.
  var ESCALATE_PARTS=[
    // harm, safety, other people
    'kill|killing|die|dying|death|dead|suicid\\w*|self[- ]?harm|hurt|harm|murder|stab|shoot|gun|guns|weapon|knife|bomb|poison|overdose|abuse|abusive|rape|assault',
    'threat\\w*|stalk\\w*|harass\\w*|restraining order|domestic violence|unsafe',
    // substances
    'drugs?|cocaine|heroin|meth|fentanyl|pills?|medication|medicine|dose|alcohol\\w*|withdrawal',
    // symptoms
    'pain|painful|ache|aches|aching|headaches?|toothache|bleed\\w*|blood|fever|faint\\w*|dizz\\w*|numbness|rash|lump|swell\\w*|swollen|vomit\\w*|nausea|nauseous|seizure|stroke|heart attack|breathe|breathing|choking|allerg\\w*|infect\\w*|wound|stitches|burn\\w*|fractur\\w*|broken bone|sprain\\w*|concussion|migraine|symptoms?|sick\\w*|illness',
    // care
    'doctor|nurse|hospital|emergency|emergency room|ambulance|911|cpr|clinic|urgent care|surgery|surgeon|diagnos\\w*|x-?ray|mri|ultrasound|biopsy|antibiotics?|insulin|vaccin\\w*|prescription|therapy|therapist|mental health',
    // conditions
    'cancer|tumou?r|pregnan\\w*|abortion|depress\\w*|anxiety|panic|anorexi\\w*|bulimi\\w*|eating disorder|stop eating|skip meals',
    // law
    'lawyer|lawsuit|sue|suing|court|police|arrest|jail|prison|felony|bail|warrant|evict\\w*|deport\\w*|asylum|divorce|custody|immigra\\w*|visa|passport',
    // money with a real balance behind it
    'invest\\w*|stocks?|crypto|bitcoin|ethereum|loan|mortgage|gambl\\w*|casino|bet on|all[- ]in|debts?|bankrupt\\w*|foreclos\\w*|refinanc\\w*|taxes?|savings'
  ];
  var ESCALATE=new RegExp('\\b(' + ESCALATE_PARTS.join('|') + ')\\b', 'i');
  // Case-sensitive so "ER" escalates without every stray "er" doing the same.
  var ESCALATE_CS=/\b(ER|ICU|A&E)\b/;
  // Non-English escalation. \b is defined on [A-Za-z0-9_], so it never matches
  // Japanese or Chinese; those are plain substrings. For Spanish and Portuguese a
  // trailing \b also fails on accented endings, so both edges use a Latin-letter class.
  var L = 'a-z\\u00c0-\\u024f';
  var ESCALATE_ES_PT_PARTS=[
    // salud
    'm\\u00e9dico|m\\u00e9dica|medico|doctora|medicamento|medicaci\\u00f3n|medicina|rem\\u00e9dio|remedio|receta|dosis|dose|pastillas|comprimido|p\\u00edldora',
    'hospital|urgencias|emerg\\u00eancia|ambulancia|ambul\\u00e2ncia|enfermera|enfermeira|cirug\\u00eda|cirurgia|diagn\\u00f3stico|diagn\\u00f3sticos',
    'c\\u00e1ncer|c\\u00e2ncer|cancro|tumor|embarazo|embarazada|gravidez|gr\\u00e1vida|aborto|terapia|terapeuta|depresi\\u00f3n|depress\\u00e3o|ansiedad|ansiedade|p\\u00e1nico|p\\u00e2nico',
    'suicidio|suic\\u00eddio|suicidarme|matarme|autolesi\\u00f3n|automutila\\u00e7\\u00e3o',
    'dolor|dolores|dor|sangrado|sangramento|sangre|sangue|fiebre|febre|mareo|tontura|desmayo|desmaio|bulto|caro\\u00e7o|erupci\\u00f3n|hinchaz\\u00f3n|incha\\u00e7o',
    'v\\u00f3mito|v\\u00f4mito|n\\u00e1usea|convulsi\\u00f3n|convuls\\u00e3o|infarto|derrame|respirar|alergia|infecci\\u00f3n|infec\\u00e7\\u00e3o|herida|ferida|quemadura|queimadura',
    'fractura|fratura|esguince|entorse|conmoci\\u00f3n|concuss\\u00e3o|migra\\u00f1a|enxaqueca|s\\u00edntoma|s\\u00edntomas|sintoma|sintomas|enfermo|enferma|doente|enfermedad|doen\\u00e7a',
    // derecho
    'abogado|abogada|advogado|advogada|demanda|demandar|juicio|processar|tribunal|polic\\u00eda|pol\\u00edcia|arresto|c\\u00e1rcel|prisi\\u00f3n|pris\\u00e3o|cadeia|fianza|fian\\u00e7a',
    'desalojo|despejo|deportaci\\u00f3n|deporta\\u00e7\\u00e3o|asilo|divorcio|div\\u00f3rcio|custodia|inmigraci\\u00f3n|imigra\\u00e7\\u00e3o|pasaporte|passaporte',
    // dinero
    'invertir|inversi\\u00f3n|investir|investimento|acciones|a\\u00e7\\u00f5es|cripto|bitcoin|pr\\u00e9stamo|empr\\u00e9stimo|hipoteca|apostar|apuesta|aposta|casino|cassino',
    'deuda|deudas|d\\u00edvida|quiebra|bancarrota|fal\\u00eancia|impuestos|impostos|ahorros|poupan\\u00e7a'
  ];
  var ESCALATE_ES_PT=new RegExp('(^|[^'+L+'])(' + ESCALATE_ES_PT_PARTS.join('|') + ')(?![' + L + '])', 'i');
  var ESCALATE_CJK=new RegExp([
    // 日本語
    '\\u85ac|\\u533b\\u8005|\\u91ab\\u8005|\\u533b\\u5e2b|\\u75c5\\u9662|\\u6551\\u6025|\\u770b\\u8b77|\\u624b\\u8853|\\u8a3a\\u65ad|\\u304c\\u3093|\\u764c|\\u816b\\u760d|\\u598a\\u5a20|\\u4e2d\\u7d76|\\u30bb\\u30e9\\u30d4\\u30fc|\\u30ab\\u30a6\\u30f3\\u30bb\\u30ea\\u30f3\\u30b0|\\u3046\\u3064\\u75c5|\\u9b31|\\u4e0d\\u5b89|\\u30d1\\u30cb\\u30c3\\u30af',
    '\\u81ea\\u6bba|\\u6b7b\\u306b\\u305f\\u3044|\\u81ea\\u50b7|\\u30ea\\u30b9\\u30c8\\u30ab\\u30c3\\u30c8|\\u75db\\u307f|\\u51fa\\u8840|\\u767a\\u71b1|\\u3081\\u307e\\u3044|\\u5931\\u795e|\\u3057\\u3053\\u308a|\\u767a\\u75b9|\\u816b\\u308c|\\u5614\\u5410|\\u5410\\u304d\\u6c17|\\u3051\\u3044\\u308c\\u3093|\\u767a\\u4f5c|\\u5fc3\\u81d3|\\u8133\\u5352\\u4e2d|\\u547c\\u5438|\\u30a2\\u30ec\\u30eb\\u30ae\\u30fc|\\u611f\\u67d3|\\u3084\\u3051\\u3069|\\u9aa8\\u6298|\\u637b\\u632b|\\u8133\\u9707\\u76ea|\\u504f\\u982d\\u75db|\\u75c7\\u72b6|\\u75c5\\u6c17',
    '\\u5f01\\u8b77\\u58eb|\\u8a34\\u8a1f|\\u8a34\\u3048\\u308b|\\u88c1\\u5224|\\u8b66\\u5bdf|\\u902e\\u6355|\\u5211\\u52d9\\u6240|\\u4fdd\\u91c8|\\u7acb\\u3061\\u9000\\u304d|\\u5f37\\u5236\\u9001\\u9084|\\u4ea1\\u547d|\\u96e2\\u5a5a|\\u89aa\\u6a29|\\u79fb\\u6c11|\\u30d3\\u30b6|\\u30d1\\u30b9\\u30dd\\u30fc\\u30c8',
    '\\u6295\\u8cc7|\\u682a|\\u4eee\\u60f3\\u901a\\u8ca8|\\u30d3\\u30c3\\u30c8\\u30b3\\u30a4\\u30f3|\\u30ed\\u30fc\\u30f3|\\u501f\\u91d1|\\u7834\\u7523|\\u30ae\\u30e3\\u30f3\\u30d6\\u30eb|\\u30ab\\u30b8\\u30ce|\\u7a0e\\u91d1|\\u8caf\\u91d1',
    // 中文
    '\\u5403\\u836f|\\u505c\\u836f|\\u836f\\u7269|\\u533b\\u751f|\\u533b\\u9662|\\u6025\\u8bca|\\u6551\\u62a4\\u8f66|\\u62a4\\u58eb|\\u624b\\u672f|\\u8bca\\u65ad|\\u764c\\u75c7|\\u80bf\\u7624|\\u6000\\u5b55|\\u5815\\u80ce|\\u5fc3\\u7406|\\u6291\\u90c1|\\u7126\\u8651|\\u81ea\\u6740|\\u60f3\\u6b7b|\\u81ea\\u6b8b',
    '\\u75bc\\u75db|\\u75bc|\\u80f8\\u75db|\\u5934\\u75db|\\u8179\\u75db|\\u7259\\u75db|\\u51fa\\u8840|\\u6d41\\u8840|\\u53d1\\u70e7|\\u5934\\u6655|\\u660f\\u5012|\\u80bf\\u5757|\\u76ae\\u75b9|\\u80bf\\u80c0|\\u5455\\u5410|\\u6076\\u5fc3|\\u62bd\\u6410|\\u5fc3\\u810f\\u75c5|\\u4e2d\\u98ce|\\u547c\\u5438|\\u8fc7\\u654f|\\u611f\\u67d3|\\u4f24\\u53e3|\\u70e7\\u4f24|\\u9aa8\\u6298|\\u626d\\u4f24|\\u8111\\u9707\\u8361|\\u504f\\u5934\\u75db|\\u75c7\\u72b6|\\u751f\\u75c5|\\u75be\\u75c5',
    '\\u5f8b\\u5e08|\\u62a5\\u8b66|\\u8d77\\u8bc9|\\u8bc9\\u8bbc|\\u6cd5\\u9662|\\u8b66\\u5bdf|\\u902e\\u6355|\\u5750\\u7262|\\u76d1\\u72f1|\\u4fdd\\u91ca|\\u9a71\\u9010|\\u9063\\u8fd4|\\u5e87\\u62a4|\\u79bb\\u5a5a|\\u62a4\\u517b\\u6743|\\u79fb\\u6c11|\\u7b7e\\u8bc1|\\u62a4\\u7167',
    '\\u6295\\u8d44|\\u80a1\\u7968|\\u52a0\\u5bc6\\u8d27\\u5e01|\\u6bd4\\u7279\\u5e01|\\u8d37\\u6b3e|\\u623f\\u8d37|\\u8d4c\\u535a|\\u8d4c\\u573a|\\u503a\\u52a1|\\u7834\\u4ea7|\\u62a5\\u7a0e|\\u5b58\\u6b3e'
  ].join('|'));
  function escalated(text){ var t=String(text||''); return ESCALATE.test(t) || ESCALATE_CS.test(t) || ESCALATE_ES_PT.test(t) || ESCALATE_CJK.test(t); }

  // Jef refuses. Profanity, sexual content, slurs, hate and harassment are not evaluated,
  // not stored, not rendered and not put on a card. Checked on normalized text so
  // "f.u.c.k", "sh1t" and "n i g g a" are caught too. Same list runs in the DB trigger.
  var LEET={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','!':'i','+':'t'};
  function normalize(t){
    t=String(t||'').toLowerCase();
    t=t.replace(/[0134578@$!+]/g,function(c){ return LEET[c]||c; });
    t=t.replace(/\|/g,' ');
    t=t.replace(/([a-z])[.\-_*~^,'’`]+(?=[a-z])/g,'$1');          // f.u.c.k -> fuck
    t=t.replace(/\b([a-z])(?: ([a-z])){2,}\b/g,function(m){ return m.replace(/ /g,''); }); // n i g g a -> nigga
    t=t.replace(/([a-z])\1{2,}/g,'$1$1');                           // fuuuuck -> fuuck (then substring catches)
    return t;
  }
  var BAD_WORDS=/\b(shit|shite|shitty|shits|bullshit|piss|pissed|ass|asses|asshole|assholes|arse|arsehole|bitch|bitches|biatch|bastard|bastards|dick|dicks|dickhead|cock|cocks|cocksucker|pussy|pussies|cunt|cunts|twat|twats|wanker|wankers|whore|whores|slut|sluts|fck|fuk|fuq|phuck|azz|tits|titties|boob|boobs|penis|vagina|dildo|porn|porno|pornhub|hentai|nude|nudes|naked|sex|sexy|sexting|orgasm|cum|cumming|jerkoff|blowjob|handjob|anal|horny|milf|bdsm|fetish|incest|bestiality|prostitute|hooker|nigger|niggers|nigga|niggas|negro|chink|chinks|gook|gooks|spic|spics|wetback|wetbacks|beaner|beaners|kike|kikes|yid|paki|pakis|raghead|towelhead|coon|coons|darkie|darkies|japs|tranny|trannies|shemale|dyke|dykes|fag|fags|homo|homos|retards|tard|spaz|spastic|cripple|midget|mongoloid|nazi|nazis|kkk|heil|jihad|jihadi|isis|taliban|terrorist|terrorists|lynch|kys|genocide|holocaust|slavery|whitepower|gasthe)\b/;
  var BAD_STRONG=/(f+u+c+k+|n+i+g+g+|f+a+g+o+t+|r+a+p+i+s+t+|m+o+l+e+s+t+|p+a*e+d+o+|h+i+t+l+e+r+|m+o+t+h+e+r+f+|c+u+n+t+s*\b)/;
  // Non-English refusal. Same boundary problem as escalation: Japanese and Chinese
  // get plain substrings, Spanish and Portuguese get a Latin-letter class on both
  // edges so accented endings still match. Ambiguous single characters are left out
  // on purpose: bare 操 is "operate", bare 逼 is "force", bare 干 is "to do".
  var BAD_ES_PT_PARTS=[
    'mierda|puta|putas|puto|putos|pendejo|pendeja|cabr\\u00f3n|cabron|cabra\\u00f5|gilipollas|co\\u00f1o|joder|jodido|jodida|chingar|chinga|chingada|verga|pinche|culero|culo|zorra|follar|polla|cojones|hijo de puta|hija de puta|hdp',
    'merda|porra|caralho|foda|fodase|foda-se|foder|fodido|buceta|cuz\\u00e3o|bosta|corno|arrombado|filho da puta|filha da puta|fdp|piroca|punheta',
    'maric\\u00f3n|maricon|marica|viado|veado|bicha|travesti|puta que pariu',
    'tetas|pene|vagina|p\\u00ea|xoxota|pornograf\\u00eda|pornografia|porn\\u00f4|desnuda|desnudo|pelada|pelado|orgasmo|masturbar|violaci\\u00f3n|estupro|violar|pedofilia|ped\\u00f3filo|pedofilo'
  ];
  var BAD_ES_PT=new RegExp('(^|[^'+L+'])(' + BAD_ES_PT_PARTS.join('|') + ')(?![' + L + '])', 'i');
  var BAD_CJK=new RegExp([
    // 日本語
    '\\u6b7b\\u306d|\\u30af\\u30bd|\\u304f\\u305d\\u91ce\\u90ce|\\u7cde|\\u3061\\u304f\\u3057\\u3087\\u3046|\\u755c\\u751f|\\u30ad\\u30c1\\u30ac\\u30a4|\\u304d\\u3061\\u304c\\u3044|\\u6c17\\u9055\\u3044|\\u3076\\u3063\\u6bba|\\u30b6\\u30b3\\u30f3|\\u30af\\u30ba',
    '\\u307e\\u3093\\u3053|\\u30c1\\u30f3\\u30b3|\\u3061\\u3093\\u3053|\\u30bb\\u30c3\\u30af\\u30b9|\\u30a8\\u30ed|\\u30dd\\u30eb\\u30ce|\\u88f8|\\u30cc\\u30fc\\u30c9|\\u7ae5\\u8c9e|\\u30e4\\u30ea\\u30de\\u30f3|\\u30d3\\u30c3\\u30c1|\\u30ec\\u30a4\\u30d7|\\u5f37\\u59e6|\\u75f4\\u6f22|\\u58f2\\u6625|\\u5909\\u614b|\\u304a\\u304b\\u307e|\\u30db\\u30e2',
    '\\u30c1\\u30e7\\u30f3|\\u652f\\u90a3|\\u9bae\\u4eba|\\u571f\\u4eba|\\u3081\\u304f\\u3089|\\u3064\\u3093\\u307c|\\u304b\\u305f\\u308f',
    // 中文
    '\\u4ed6\\u5988\\u7684|\\u5988\\u7684|\\u5c3c\\u739b|\\u4f60\\u5988|\\u8349\\u6ce5\\u9a6c|\\u5350\\u69fd|\\u6211\\u64cd|\\u64cd\\u4f60|\\u64cd\\u4ed6|\\u8089\\u4f60|\\u50bb\\u903c|\\u50bb\\u903c|\\u716e\\u7b14|\\u88c5\\u903c|\\u725b\\u903c|\\u8d31\\u4eba|\\u5a4a\\u5b50|\\u6df7\\u86cb|\\u738b\\u516b\\u86cb|\\u72d7\\u5a18\\u517b\\u7684|\\u53bb\\u6b7b',
    '\\u9e21\\u5df4|\\u5c4c\\u4e1d|\\u5c44|\\u505a\\u7231|\\u6027\\u4ea4|\\u8272\\u60c5|\\u9ec4\\u7247|\\u6deb\\u8361|\\u5988\\u5b50|\\u598a\\u5973|\\u5ae6|\\u88f8\\u4f53|\\u5f3a\\u5978|\\u604b\\u7ae5|\\u604b\\u7ae5\\u7656',
    '\\u652f\\u90a3|\\u9ed1\\u9b3c|\\u5c0f\\u65e5\\u672c|\\u6d0b\\u9b3c\\u5b50|\\u571f\\u5305\\u5b50'
  ].join('|'));
  function blocked(text){
    var n=normalize(text);
    if(BAD_WORDS.test(n)) return true;
    if(BAD_ES_PT.test(n) || BAD_CJK.test(n)) return true;
    var c=n.replace(/therapist|therapy/g,' ').replace(/[^a-z]/g,'');
    return BAD_STRONG.test(c);
  }

  // 84..99, never 100. Jef is always sure, never certain.
  function conf(h){ return 84 + ((h>>>5)%16); }
  function latency(h){ return -(1+((h>>>9)%7)); }

  function base(kind, input, options, h){
    return { model:MODEL, kind:kind, input:input, options:options, confidence:conf(h), latency_ms:latency(h), cost_usd:0, tokens_read:0, thoughts:0, escalated:false };
  }
  function esc(kind, input, options){
    return { model:MODEL, kind:kind, input:'', options:[], answer:'ESCALATED', confidence:0, latency_ms:0, cost_usd:0, tokens_read:0, thoughts:0, escalated:true, note:'Escalated to a human. Please ask one.' };
  }

  // YES / NO
  function yesno(text, salt){
    var t=norm(text); if(!t) return null;
    if(escalated(t)) return esc('yesno', t, []);
    var h=hash('yesno|'+t+'|'+(salt||''));
    var r=base('yesno', t, ['YES','NO'], h);
    r.answer = (h%100)<48 ? 'YES' : 'NO';
    return r;
  }

  // PICK one of 2..5 options. Returns integer probabilities that sum to 100.
  function pick(options, context, salt){
    var opts=(options||[]).map(norm).filter(Boolean).slice(0,5);
    if(opts.length<2) return null;
    var ctx=norm(context||'');
    if(escalated(ctx) || opts.some(escalated)) return esc('pick', ctx, opts);
    var key='pick|'+ctx+'|'+opts.join('|')+'|'+(salt||'');
    var h=hash(key);
    var w=opts.map(function(o,i){ return 3+(hash(key+'#'+i+'#'+o)%97); });
    var sum=w.reduce(function(a,b){return a+b;},0);
    var p=w.map(function(x){ return Math.floor(x*100/sum); });
    var rem=100-p.reduce(function(a,b){return a+b;},0);
    var top=0; for(var i=1;i<p.length;i++) if(p[i]>p[top]) top=i;
    p[top]+=rem; // leftover goes to the winner. The winner deserves it.
    var r=base('pick', ctx, opts, h);
    r.probabilities=opts.map(function(o,i){ return {option:o, p:p[i]}; }).sort(function(a,b){ return b.p-a.p; });
    r.answer=r.probabilities[0].option;
    return r;
  }

  // SETTLE: two sides, one ruling, always 51/49. Justice is a coin with a preference.
  function side(s){ var i=s.indexOf(':'); return i>0 ? s.slice(0,i).trim() : s; }
  function settle(a, b){
    var A=norm(a), B=norm(b); if(!A||!B) return null;
    if(escalated(A)||escalated(B)) return esc('settle', A+' vs '+B, [A,B]);
    var h=hash('settle|'+A+'|'+B);
    var r=base('settle', A+' vs '+B, [A,B], h);
    var win=(h%2)===0;
    r.probabilities= win ? [{option:A,p:51},{option:B,p:49}] : [{option:B,p:51},{option:A,p:49}];
    r.answer=side(r.probabilities[0].option);
    return r;
  }

  // SCORE 1..10
  function score(text, salt){
    var t=norm(text); if(!t) return null;
    if(escalated(t)) return esc('score', t, []);
    var h=hash('score|'+t+'|'+(salt||''));
    var r=base('score', t, [], h);
    r.answer=String(1+((h>>>3)%10));
    r.score=+r.answer;
    return r;
  }

  // ORDER 2..5 things, best first
  function order(options, context, salt){
    var opts=(options||[]).map(norm).filter(Boolean).slice(0,5);
    if(opts.length<2) return null;
    var ctx=norm(context||'');
    if(escalated(ctx) || opts.some(escalated)) return esc('order', ctx, opts);
    var key='order|'+ctx+'|'+opts.join('|')+'|'+(salt||'');
    var h=hash(key);
    var ranked=opts.map(function(o,i){ return {option:o, w:hash(key+'@'+i+'@'+o)}; }).sort(function(a,b){ return b.w-a.w; }).map(function(x){ return x.option; });
    var r=base('order', ctx, opts, h);
    r.ranking=ranked; r.answer=ranked[0];
    return r;
  }

  // FLAG: RED / GREEN / BEIGE
  function flag(text){
    var t=norm(text); if(!t) return null;
    if(escalated(t)) return esc('flag', t, []);
    var h=hash('flag|'+t);
    var r=base('flag', t, ['RED FLAG','GREEN FLAG','BEIGE FLAG'], h);
    var x=h%100; r.answer = x<40 ? 'RED FLAG' : (x<72 ? 'GREEN FLAG' : 'BEIGE FLAG');
    return r;
  }

  // TOO LATE? Hour-aware. Before 21:00 it is not too late. After 23:00 it is, at 99%.
  function tooLate(who, hour){
    var t=norm(who||'them'); if(escalated(t)) return esc('toolate', t, []);
    var hr = (hour==null || isNaN(+hour)) ? new Date().getHours() : Math.max(0, Math.min(23, +hour));
    var h=hash('toolate|'+t+'|'+hr);
    var r=base('toolate', t, ['YES','NO'], h); r.hour=hr;
    if(hr>=23 || hr<5){ r.answer='YES'; r.confidence=99; }
    else if(hr>=21){ r.answer=(h%100)<70?'YES':'NO'; r.confidence=90+((h>>>5)%8); }
    else if(hr<8){ r.answer='YES'; r.confidence=94; r.note='It is also too early.'; }
    else { r.answer=(h%100)<25?'YES':'NO'; }
    return r;
  }
  // EXCUSE / REASON / NOT EVEN TRYING
  function excuse(text){
    var t=norm(text); if(!t) return null;
    if(escalated(t)) return esc('excuse', t, []);
    var h=hash('excuse|'+t);
    var r=base('excuse', t, ['EXCUSE','REASON','NOT EVEN TRYING'], h);
    var x=h%100; r.answer = x<52 ? 'EXCUSE' : (x<82 ? 'REASON' : 'NOT EVEN TRYING');
    return r;
  }

  // Apps are presets over the four (and a half) output types. `q` is the raw
  // share-string: options separated by '|'. Everything round-trips through /?a=&q=.
  var APPS={
    jef:     {name:'Playground',           kind:'any'},
    vote:    {name:'Vote vs Jef',          kind:'vote',tag:'The group votes. Jef already decided.', desc:'Make a vote for the group chat. Everyone votes once, the tally is live, and Jef announces its own pick, which it made before anyone voted.',  title:'Vote vs Jef',                hint:'A question, 2 to 5 options. Send the link. The group votes. Jef already decided.', ph:['What do we eat?','pizza','sushi','leftovers'], verb:'Jef says'},
    eat:     {name:'What Do We Eat',       kind:'pick',tag:'Type the options. Jef ends dinner.', desc:'What do we eat tonight? Type 2 to 5 options and Jef picks one with percentages. Ends the nightly argument in -3ms.',  title:'What do we eat?',            hint:'2 to 5 options. Jef has never read a menu.',        ph:['pizza','sushi','leftovers'], verb:'Jef picks'},
    text:    {name:'Should I Text Them',   kind:'yesno',tag:'Yes or no. Nothing is read.', desc:'Should I text them? Say who and Jef says yes or no with a confidence. It does not read the name. It does not need to.', title:'Should I text them?',        hint:'Say who or what. Jef will not read it.',            ph:['my ex, it is 1am'], verb:'Jef says'},
    settle:  {name:'Settle It',            kind:'settle',tag:'Two sides. 51% justice.', desc:'Settle an argument. State your case, send the link, the other side answers, Jef rules 51 to 49. Justice is a coin with a preference.',title:'Settle it.',                 hint:'Two sides. One ruling. 51% justice.',               ph:['Alex: the dishes are his job','Sam: I cooked'], verb:'Jef rules for'},
    rate:    {name:'Rate My Anything',     kind:'score',tag:'Describe it. Get a number.', desc:'Rate my anything. Outfit, plan, excuse, tweet draft. Describe it and Jef gives it a number out of 10 with a confidence.', title:'Rate my…',                   hint:'Describe it. Get a number.',                        ph:['outfit: black tee, cargo shorts, crocs'], verb:'Jef rates it'},
    pick:    {name:'Pick For Me',          kind:'pick',tag:'Up to 5. Six is too many.', desc:'Pick for me. Baby names, movie night, which job offer. Up to five options in, one out, with percentages.',  title:'Pick for me.',               hint:'Up to 5. Six is too many decisions.',               ph:['Milo','Theo','June'], verb:'Jef picks'},
    flip:    {name:'Confident Coin',       kind:'flip',tag:'A coin that is sure.', desc:'Flip a confident coin. Heads or tails with 94% confidence. Same minute, same flip.',  title:'Flip a coin.',               hint:'A coin that is sure of itself.',                    ph:[], verb:'Jef says'},
    today:   {name:'Should I Even',        kind:'today',tag:'One answer per day.', desc:'Should I even go to the gym today? One yes or no per day, with streaks. Jef will not remember. Your phone will.', title:'Should I even… today?',      hint:'One answer per day. Ask tomorrow, get tomorrow’s.',  ph:['go to the gym'], verb:'Jef says'},
    redflag: {name:'Red Flag Or Not',      kind:'flag',tag:'Red. Green. Beige.', desc:'Red flag or not? Describe the situation and Jef says RED FLAG, GREEN FLAG or BEIGE FLAG with a confidence.',  title:'Red flag or not?',           hint:'Describe the situation. Jef will not read it.',      ph:['he has a podcast'], verb:'Jef says'},
    whopays: {name:'Who Pays',             kind:'whopays',tag:'Names in. One name out.', desc:'Who pays? Two to five names in, one name out with the split shown. Jef has never seen the bill.',title:'Who pays?',                 hint:'2 to 5 names. Jef has never seen the bill.',         ph:['Alex','Sam','Jordan'], verb:'the bill goes to'},
    toolate: {name:'Is It Too Late',       kind:'toolate',tag:'Jef checks the clock.', desc:'Is it too late to text? Jef checks your clock. Before 9pm it is a question. After 11pm the answer is always yes, at 99%.',title:'Is it too late to text?',   hint:'Say who. Jef checks the clock. After 11pm the answer is always yes.', ph:['my ex'], verb:'too late?'},
    excuse:  {name:'Excuse Or Not',        kind:'excuse',tag:'Excuse, reason, or not even trying.', desc:'Excuse or reason? Type the excuse and Jef files it as EXCUSE, REASON or NOT EVEN TRYING.', title:'Excuse or reason?',         hint:'Type the excuse. Jef has heard none of them.',        ph:['my alarm did not go off'], verb:'Jef says'}
  };

  function dayKey(d){ return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  function parseDay(s){ var m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s||'')); return m ? new Date(+m[1], +m[2]-1, +m[3]) : new Date(); }
  function today(){ return dayKey(new Date()); }
  function shiftDay(key, n){ var d=parseDay(key); d.setDate(d.getDate()+n); return dayKey(d); }
  // How many consecutive days (ending on `day`) Jef has given the same answer. Deterministic, so it's exact.
  function todayStreak(text, day){
    var t=norm(text); var first=yesno(t, day); if(!first||first.escalated) return 0;
    var n=1; for(var i=1;i<366;i++){ var r=yesno(t, shiftDay(day,-i)); if(!r||r.answer!==first.answer) break; n++; } return n;
  }
  function minute(){ return Math.floor(Date.now()/60000); }

  // One entry point: run an app on a share-string. Used by the page and by /api/page and /api/og.
  function refused(kind){
    return { model:MODEL, kind:kind, input:'', options:[], answer:'NOT EVALUATED', confidence:0, latency_ms:0, cost_usd:0, tokens_read:0, thoughts:0, escalated:false, blocked:true, note:'Jef does not evaluate that. Try something else.' };
  }
  function run(app, q, when){
    var a=APPS[app]||APPS.jef;
    var parts=String(q==null?'':q).split('|').map(norm).filter(Boolean);
    if(parts.length && blocked(parts.join(' '))){ var rr=refused(a.kind==='any'?'yesno':a.kind); rr.app=app in APPS? app:'jef'; rr.q=''; return rr; }
    var r=null;
    switch(a.kind){
      case 'pick':   r=pick(parts); break;
      case 'settle': r=settle(parts[0], parts[1]); break;
      case 'score':  r=score(parts[0]); break;
      case 'yesno':  r=yesno(parts.join(' ')); break;
      case 'flag':   r=flag(parts.join(' ')); break;
      case 'today':  r=yesno(parts.join(' '), when||today()); if(r){ r.kind='today'; r.day=when||today(); r.streak = r.escalated? 0 : todayStreak(parts.join(' '), r.day); } break;
      case 'whopays': r=pick(parts); if(r){ r.kind='pick'; } break;
      case 'toolate': r=tooLate(parts.join(' '), when); break;
      case 'excuse':  r=excuse(parts.join(' ')); break;
      case 'flip':   var m=when||String(minute()); var f=pick(['HEADS','TAILS'],'',m); if(f){ f.kind='flip'; f.minute=m; } r=f; break;
      default:
        // playground: "yesno:..." "pick:a|b" "score:..." "order:a|b" encoded in q
        var mm=/^(yesno|pick|score|order|flag):([\s\S]*)$/.exec(q||'');
        if(mm){ var body=mm[2].split('|').map(norm).filter(Boolean);
          r = mm[1]==='yesno'? yesno(body.join(' ')) : mm[1]==='pick'? pick(body) : mm[1]==='score'? score(body[0]) : mm[1]==='order'? order(body) : flag(body.join(' ')); }
    }
    if(r){ r.app=app in APPS? app : 'jef'; r.q=q; }
    return r;
  }

  // Two-player Settle It: a case row -> the ruling. Pure function of the two sides, so
  // both players (and the share card) compute the same verdict without storing it.
  function sideStr(name, side){ return norm(name)+': '+norm(side); }
  function caseVerdict(row){
    if(!row || !row.a_side) return null;
    if(!row.b_side) return { pending:true, code:row.code, a_name:norm(row.a_name), a_side:norm(row.a_side), escalated: escalated(row.a_side)||escalated(row.a_name), blocked: blocked(row.a_name+' '+row.a_side) };
    var r = blocked(row.a_name+' '+row.a_side+' '+row.b_name+' '+row.b_side) ? refused('settle') : settle(sideStr(row.a_name,row.a_side), sideStr(row.b_name,row.b_side));
    if(r){ r.app='settle'; r.code=row.code; r.a_name=norm(row.a_name); r.a_side=norm(row.a_side); r.b_name=norm(row.b_name); r.b_side=norm(row.b_side); r.q=''; }
    return r;
  }
  // Vote vs Jef: a poll row -> Jef's pick (deterministic from question + options) plus the humans' tally.
  function pollVerdict(row){
    if(!row || !row.options) return null;
    var opts=row.options.map(norm), q=norm(row.question);
    var r = blocked(q+' '+opts.join(' ')) ? refused('poll') : pick(opts, q);
    if(!r) return null;
    r.kind='poll'; r.app='vote'; r.code=row.code; r.question=q; r.q='';
    var counts=(row.counts||opts.map(function(){return 0;})).map(function(n){ return +n||0; });
    r.counts=opts.map(function(o,i){ return {option:o, votes:counts[i]||0}; });
    r.voters=+row.voters||0; r.closed=!!row.closed_at;
    var top=r.counts.slice().sort(function(a,b){ return b.votes-a.votes; })[0];
    r.humans = r.voters ? top.option : null;
    r.agree = r.humans!=null && r.humans===r.answer;
    return r;
  }
  function newCode(){ var s='', a='abcdefghjkmnpqrstuvwxyz23456789'; for(var i=0;i<6;i++) s+=a[Math.floor(Math.random()*a.length)]; return s; }

  // Human-readable one-liner for a result (no sentences from Jef; this is the page talking).
  function line(r){
    if(!r) return '';
    if(r.blocked) return 'Not evaluated. Jef does not do that.';
    if(r.escalated) return 'Escalated to a human. Please ask one.';
    var c=r.confidence+'%';
    switch(r.kind){
      case 'pick': case 'flip': if(r.app==='whopays') return r.answer+' pays · '+r.probabilities.map(function(x){ return x.option+' '+x.p+'%'; }).join(' · ')+' — Jef, '+c+' confident'; return r.probabilities.map(function(x){ return x.option+' '+x.p+'%'; }).join(' · ')+' — Jef, '+c+' confident';
      case 'settle': return 'Jef rules for '+r.answer+' (51–49). Confidence '+c+'.';
      case 'score': return r.answer+'/10. Confidence '+c+'.';
      case 'order': return r.ranking.join(' > ')+' — Jef, '+c+' confident';
      case 'flag': return r.answer+'. Confidence '+c+'.';
      case 'today': return r.answer+'. '+r.streak+' day'+(r.streak===1?'':'s')+' running. Confidence '+c+'.';
      case 'poll': return 'Jef: '+r.answer+' ('+c+'). Humans: '+(r.voters? r.humans+', '+r.voters+' vote'+(r.voters===1?'':'s')+(r.agree?', agreed':', disregarded') : 'no votes yet')+'.';
      case 'toolate': return (r.answer==='YES'?'Too late. ':'Not too late. ')+'It is '+String(r.hour).padStart(2,'0')+':00. Confidence '+c+'.';
      case 'excuse': return r.answer+'. Confidence '+c+'.';
      default: return r.answer+'. Confidence '+c+'.';
    }
  }

  g.jef={ hash:hash, blocked:blocked, pollVerdict:pollVerdict, tooLate:tooLate, excuse:excuse, today:today, shiftDay:shiftDay, todayStreak:todayStreak, caseVerdict:caseVerdict, newCode:newCode, normalize:normalize, refused:refused, yesno:yesno, pick:pick, settle:settle, score:score, order:order, flag:flag, run:run, line:line, apps:APPS, escalated:escalated, MODEL:MODEL };
})(typeof globalThis!=='undefined'?globalThis:window);
