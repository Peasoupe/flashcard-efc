const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jszip.min-DtLTtT9U.js","assets/chunk-62oNxeRG.js"])))=>i.map(i=>d[i]);
import{i as e}from"./chunk-62oNxeRG.js";import{a as t,i as n,n as r,r as i}from"./AuthContext-DDg4H_jm.js";import{t as a}from"./preload-helper-D4M6sveU.js";import{n as o,t as s}from"./index-DFZF8xSI.js";var c=e(t(),1),l=i();function u(e){let t=[],n=0,r=e.length;function i(t){if(n<r&&e[n]===`"`){n++;let i=``;for(;n<r;)if(e[n]===`"`)if(e[n+1]===`"`)i+=`"`,n+=2;else{n++;break}else i+=e[n++];return n<r&&(e[n]===t||e[n]===`;`||e[n]===`,`)&&n++,i}else{let i=n;for(;n<r&&e[n]!==t&&e[n]!==`
`&&e[n]!==`\r`;)n++;let a=e.slice(i,n).trim();return n<r&&(e[n]===t||e[n]===`;`||e[n]===`,`)&&n++,a}}for(;n<r;){for(;n<r&&(e[n]===`\r`||e[n]===`
`);)n++;if(n>=r)break;let a=n,o=`,`;{let t=n;if(e[t]===`"`){for(t++;t<r&&!(e[t]===`"`&&e[t+1]!==`"`);)t++;t+=2}else for(;t<r&&e[t]!==`,`&&e[t]!==`;`&&e[t]!==`
`;)t++;t<r&&e[t]===`;`&&(o=`;`)}n=a;let s=i(o),c=i(o);for(;n<r&&e[n]!==`
`;)n++;s&&c&&t.push({front:s,back:c})}return t}async function d(e){let t=await a(()=>import(`./xlsx-C30Uh-nP.js`),[]),n=t.read(e,{type:`array`}),r=n.Sheets[n.SheetNames[0]],i=t.utils.sheet_to_json(r,{header:1,defval:``}),o=[];for(let e of i){let t=String(e[0]??``).trim(),n=String(e[1]??``).trim();t&&n&&o.push({front:t,back:n})}return o}async function f(t){let{default:n}=await a(async()=>{let{default:t}=await import(`./jszip.min-DtLTtT9U.js`).then(t=>e(t.default,1));return{default:t}},__vite__mapDeps([0,1])),r=(await n.loadAsync(t)).files[`word/document.xml`];if(!r)return[];let i=await r.async(`string`),o=new DOMParser().parseFromString(i,`application/xml`),s=`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,c=o.getElementsByTagNameNS(s,`p`),l=[],u=null,d=[];function f(){u&&d.length>0&&l.push({front:u,back:d.join(`
`).trim()}),d=[],u=null}for(let e of c){let t=e.getElementsByTagNameNS(s,`pPr`)[0],n=t?.getElementsByTagNameNS(s,`pStyle`)[0]?.getAttribute(`${s.replace(`http://schemas.openxmlformats.org/wordprocessingml/2006/main`,``)}val`)??t?.getElementsByTagNameNS(s,`pStyle`)[0]?.getAttributeNS(s,`val`)??t?.getElementsByTagNameNS(s,`pStyle`)[0]?.getAttribute(`w:val`)??``,r=e.getElementsByTagNameNS(s,`t`),i=Array.from(r).map(e=>e.textContent).join(``).trim();/^(Heading|Titre|heading|titre)\d?$/i.test(n)||/^heading/i.test(n)?(f(),i&&(u=i)):u!==null&&(i===`---`?d.push(`---`):i&&d.push(i))}return f(),l}async function p(t){let{default:n}=await a(async()=>{let{default:t}=await import(`./jszip.min-DtLTtT9U.js`).then(t=>e(t.default,1));return{default:t}},__vite__mapDeps([0,1])),r=await n.loadAsync(t),i=Object.keys(r.files).filter(e=>/^ppt\/slides\/slide\d+\.xml$/.test(e)).sort((e,t)=>{let n=e=>parseInt(e.match(/\d+/)[0]);return n(e)-n(t)});function o(e){let t=new DOMParser().parseFromString(e,`application/xml`),n=[],r=t.getElementsByTagNameNS(`http://schemas.openxmlformats.org/presentationml/2006/main`,`sp`);for(let e of r){let t=e.getElementsByTagNameNS(`http://schemas.openxmlformats.org/presentationml/2006/main`,`ph`),r=t.length>0&&t[0].getAttribute(`type`)||`body`,i=e.getElementsByTagNameNS(`http://schemas.openxmlformats.org/drawingml/2006/main`,`p`),a=[];for(let e of i){let t=e.getElementsByTagNameNS(`http://schemas.openxmlformats.org/drawingml/2006/main`,`t`),n=Array.from(t).map(e=>e.textContent).join(``);n.trim()&&a.push(n)}let o=a.join(`
`).trim();o&&n.push({type:r,text:o})}return n}let s=[];for(let e of i){let t=o(await r.files[e].async(`string`)),n=t.find(e=>e.type===`title`||e.type===`ctrTitle`),i=t.filter(e=>e!==n),a=n?n.text:t[0]?.text??``,c=i.length>0?i.map(e=>e.text).join(`
`):t[1]?.text??``;a&&c&&s.push({front:a,back:c})}return s}var m={excel:`Tu vas reformater un fichier Excel pour qu'il soit compatible avec l'application de flashcards FlashEFC.

STRUCTURE REQUISE :
- Colonne A : question / recto de la carte
- Colonne B : réponse / verso de la carte
- Une carte par ligne, pas d'en-tête obligatoire

SAUTS DE LIGNE DANS UNE CELLULE :
Dans Excel, les sauts de ligne à l'intérieur d'une cellule se font avec Alt+Entrée. Dans le fichier .xlsx généré, ils apparaissent comme des retours à la ligne normaux dans la cellule.

BULLET POINTS :
Commence chaque point par • ou - suivi d'un espace. Chaque point sur sa propre ligne (Alt+Entrée entre chaque).
Exemple dans la cellule B2 :
• Premier critère
• Deuxième critère
• Troisième critère

CARROUSEL PAR ÉTAPES :
Pour diviser une réponse en plusieurs étapes affichées l'une après l'autre, sépare chaque étape par --- seul sur une ligne.
Exemple dans la cellule B2 :
**Étape 1 — Identifier l'enjeu :**
Texte de l'étape 1
---
**Étape 2 — Évaluer les critères :**
• Critère A
• Critère B
---
**Étape 3 — Conclure :**
Texte de conclusion

MISE EN FORME :
- Gras : **texte**
- Les titres d'étapes en gras sont recommandés

Reformate maintenant le fichier Excel fourni en respectant ces règles. Conserve le contenu original, adapte uniquement la structure et la mise en forme.`,csv:`Tu vas reformater un fichier en CSV pour qu'il soit compatible avec l'application de flashcards FlashEFC.

STRUCTURE REQUISE :
- Deux colonnes séparées par une virgule ou un point-virgule
- Colonne 1 : question / recto de la carte
- Colonne 2 : réponse / verso de la carte
- Une carte par ligne, pas d'en-tête obligatoire
- Les cellules contenant des sauts de ligne ou des virgules doivent être entourées de guillemets doubles

BULLET POINTS :
Commence chaque point par • ou - suivi d'un espace, séparés par des sauts de ligne à l'intérieur de la cellule (la cellule doit être entre guillemets doubles).
Exemple :
"Qu'est-ce que le goodwill ?","• Excédent du coût d'acquisition sur la JV des actifs nets
• Comptabilisé uniquement lors d'un regroupement
• Soumis à un test de dépréciation annuel"

CARROUSEL PAR ÉTAPES :
Pour diviser une réponse en plusieurs étapes, sépare chaque étape par --- seul sur une ligne à l'intérieur de la cellule (entre guillemets doubles).
Exemple :
"Étapes de comptabilisation","**Étape 1 — Identifier l'enjeu :**
Texte de l'étape 1
---
**Étape 2 — Évaluer les critères :**
• Critère A
• Critère B
---
**Étape 3 — Conclure :**
Texte de conclusion"

MISE EN FORME :
- Gras : **texte**
- Les titres d'étapes en gras sont recommandés
- Encodage : UTF-8

Génère maintenant le fichier CSV en respectant ces règles. Conserve le contenu original, adapte uniquement la structure et la mise en forme.`,word:`Tu vas reformater un document Word pour qu'il soit compatible avec l'application de flashcards FlashEFC.

STRUCTURE REQUISE :
- Chaque carte commence par un titre en style "Titre 2" (Heading 2) → ce sera le recto (question)
- Le texte en style "Normal" qui suit → ce sera le verso (réponse)
- La prochaine ligne "Titre 2" démarre une nouvelle carte automatiquement

BULLET POINTS :
Utilise les listes à puces normales de Word. Chaque point sera converti automatiquement.
Tu peux aussi écrire • ou - en début de ligne dans un paragraphe Normal.

CARROUSEL PAR ÉTAPES :
Pour diviser le verso en plusieurs étapes affichées l'une après l'autre, ajoute un paragraphe Normal contenant uniquement --- entre chaque étape.

MISE EN FORME :
- Gras : **texte** ou gras natif de Word
- Ne pas utiliser Titre 1 (réservé au titre du document)
- Encodage : UTF-8

Reformate maintenant le document Word en respectant ces règles. Conserve le contenu original, adapte uniquement la structure et la mise en forme.`,pptx:`Tu vas reformater une présentation PowerPoint pour qu'elle soit compatible avec l'application de flashcards FlashEFC.

STRUCTURE REQUISE :
- Une carte par slide
- Titre de la slide → recto de la carte (question)
- Contenu / corps de la slide → verso de la carte (réponse)
- Les slides sans titre ou sans contenu seront ignorées

BULLET POINTS :
Utilise les listes à puces normales de PowerPoint. Chaque point sera automatiquement converti en liste dans l'application.

CARROUSEL PAR ÉTAPES :
Pour diviser le verso en plusieurs étapes, place le texte --- seul sur une ligne dans la zone de contenu de la slide.

MISE EN FORME :
- Gras : **texte** ou utilise le gras natif de PowerPoint
- Une seule zone de titre et une seule zone de contenu par slide

Reformate maintenant la présentation PowerPoint en respectant ces règles. Conserve le contenu original, adapte uniquement la structure et la mise en forme.`};function h(){let[e,t]=(0,c.useState)(`excel`),[n,r]=(0,c.useState)(!1);function i(){navigator.clipboard.writeText(m[e]).then(()=>{r(!0),setTimeout(()=>r(!1),2e3)})}let a=t=>`px-2 py-0.5 text-xs transition-colors ${e===t?`bg-foret text-ivoire`:`bg-ivoire-2 text-ink-2 hover:bg-rule/40`}`;return(0,l.jsxs)(`div`,{className:`border border-rule rounded-xl overflow-hidden`,children:[(0,l.jsxs)(`div`,{className:`flex items-center justify-between bg-ivoire-2 px-3 py-2 gap-2 border-b border-rule`,children:[(0,l.jsxs)(`div`,{className:`flex items-center gap-2 min-w-0`,children:[(0,l.jsx)(`span`,{className:`text-xs font-bold text-ink-3 uppercase tracking-[1.5px] shrink-0`,children:`Prompt IA`}),(0,l.jsx)(`div`,{className:`flex rounded-lg overflow-hidden border border-rule text-xs shrink-0`,children:[`excel`,`csv`,`pptx`,`word`].map(e=>(0,l.jsx)(`button`,{type:`button`,onClick:()=>{t(e),r(!1)},className:a(e),children:e===`pptx`?`PowerPoint`:e.charAt(0).toUpperCase()+e.slice(1)},e))})]}),(0,l.jsx)(`button`,{type:`button`,onClick:i,className:`text-xs px-2.5 py-1 rounded-lg bg-foret text-ivoire hover:brightness-90 transition-all shrink-0`,children:n?`✓ Copié !`:`Copier`})]}),(0,l.jsx)(`textarea`,{readOnly:!0,value:m[e],rows:5,className:`w-full text-xs text-ink-3 px-3 py-2 resize-none bg-ivoire-2 focus:outline-none font-mono leading-relaxed`})]})}function g({card:e,index:t}){return(0,l.jsxs)(`div`,{className:`bg-ivoire border border-rule rounded-2xl p-4`,style:{boxShadow:`0 12px 28px -16px rgba(28,24,20,0.18)`},children:[(0,l.jsxs)(`p`,{className:`text-xs font-bold uppercase tracking-[2px] text-ink-3 mb-2`,children:[`Carte `,t+1]}),(0,l.jsx)(`p`,{className:`font-bold text-ink text-sm leading-snug mb-2`,children:e.front}),(0,l.jsx)(`div`,{className:`border-t border-rule pt-2`,children:(0,l.jsx)(`p`,{className:`text-xs text-ink-2 line-clamp-3`,children:e.back})})]})}function _({onClose:e,onImported:t}){let{user:i}=r(),a=(0,c.useRef)(),[o,s]=(0,c.useState)(``),[m,_]=(0,c.useState)(null),[v,y]=(0,c.useState)(``),[b,x]=(0,c.useState)(!1);function S(e){let t=e.target.files[0];if(!t)return;y(``),s(t.name.replace(/\.(csv|xlsx|xls|pptx|docx)$/i,``));let n=/\.pptx$/i.test(t.name),r=/\.(xlsx|xls)$/i.test(t.name),i=/\.docx$/i.test(t.name),a=new FileReader;a.onload=async e=>{try{let t;t=n?await p(e.target.result):i?await f(e.target.result):r?d(e.target.result):u(e.target.result),t.length===0?(y(`Aucune carte trouvée. Vérifiez le format du fichier.`),_(null)):_(t)}catch{y(`Erreur lors de la lecture du fichier.`),_(null)}},n||r||i?a.readAsArrayBuffer(t):a.readAsText(t,`UTF-8`)}async function C(){if(!o.trim()||!m?.length)return;x(!0);let{data:r,error:a}=await n.from(`decks`).insert({name:o.trim(),user_id:i.id}).select().single();if(a){y(`Erreur lors de la création du deck.`),x(!1);return}let s=m.map(e=>({deck_id:r.id,front:e.front,back:e.back})),{error:c}=await n.from(`cards`).insert(s);if(c){y(`Erreur lors de l'import des cartes.`),x(!1);return}t(),e()}return(0,l.jsx)(`div`,{className:`fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4`,children:(0,l.jsxs)(`div`,{className:`bg-ivoire-2 rounded-2xl w-full max-w-lg border border-rule`,style:{boxShadow:`0 12px 28px -16px rgba(28,24,20,0.18)`},children:[(0,l.jsxs)(`div`,{className:`flex items-center justify-between p-5 border-b border-rule`,children:[(0,l.jsx)(`h2`,{className:`font-display font-semibold text-foret`,style:{fontSize:`22px`},children:`Importer un fichier`}),(0,l.jsx)(`button`,{onClick:e,className:`text-ink-3 hover:text-ink text-xl leading-none transition-colors`,children:`×`})]}),(0,l.jsxs)(`div`,{className:`p-5 space-y-4`,children:[(0,l.jsxs)(`div`,{className:`bg-ivoire border border-rule rounded-xl px-4 py-3 text-xs text-ink-3 space-y-1`,children:[(0,l.jsx)(`p`,{className:`font-bold text-ink-2 uppercase tracking-[1.5px] text-[11px]`,children:`Format attendu`}),(0,l.jsx)(`p`,{children:`Excel (.xlsx) et CSV (.csv) : colonne A = question, colonne B = réponse.`}),(0,l.jsx)(`p`,{children:`PowerPoint (.pptx) : titre de la slide = question, contenu = réponse.`}),(0,l.jsx)(`p`,{children:`Word (.docx) : Titre 2 = question, paragraphes suivants = réponse.`})]}),(0,l.jsx)(h,{}),(0,l.jsxs)(`div`,{children:[(0,l.jsx)(`label`,{className:`block text-xs font-bold uppercase tracking-[1.5px] text-ink-3 mb-2`,children:`Fichier Excel, CSV, PowerPoint ou Word`}),(0,l.jsx)(`input`,{ref:a,type:`file`,accept:`.csv,.xlsx,.xls,.pptx,.docx,text/csv`,onChange:S,className:`w-full text-sm text-ink-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-rule file:bg-ivoire file:text-ink-2 file:text-xs file:font-bold hover:file:bg-rule/30 cursor-pointer`})]}),v&&(0,l.jsx)(`p`,{className:`text-sm text-ivoire bg-seal rounded-xl px-4 py-2`,children:v}),m&&(0,l.jsxs)(`div`,{children:[(0,l.jsx)(`label`,{className:`block text-xs font-bold uppercase tracking-[1.5px] text-ink-3 mb-2`,children:`Nom du deck`}),(0,l.jsx)(`input`,{value:o,onChange:e=>s(e.target.value),className:`w-full border-b border-rule bg-transparent text-ink text-sm py-1.5 focus:outline-none focus:border-foret transition-colors`})]}),m&&(0,l.jsxs)(`div`,{children:[(0,l.jsxs)(`p`,{className:`text-xs font-bold uppercase tracking-[1.5px] text-ink-3 mb-3`,children:[`Aperçu — `,m.length,` carte`,m.length===1?``:`s`,` détectée`,m.length===1?``:`s`]}),(0,l.jsx)(`div`,{className:`grid gap-3 sm:grid-cols-3`,children:m.slice(0,3).map((e,t)=>(0,l.jsx)(g,{card:e,index:t},t))}),m.length>3&&(0,l.jsxs)(`p`,{className:`text-xs text-ink-3 text-center mt-3`,children:[`+ `,m.length-3,` autre`,m.length-3>1?`s`:``,` carte`,m.length-3>1?`s`:``]})]})]}),(0,l.jsxs)(`div`,{className:`flex justify-end gap-3 p-5 border-t border-rule`,children:[(0,l.jsx)(`button`,{onClick:e,className:`text-sm px-4 py-2 text-ink-3 hover:text-ink transition-colors`,children:`Annuler`}),(0,l.jsx)(`button`,{onClick:C,disabled:b||!m?.length||!o.trim(),className:`bg-foret text-ivoire text-sm px-5 py-2 rounded-[18px] hover:brightness-90 disabled:opacity-40 transition-all font-bold`,children:b?`Import en cours…`:`Importer ${m?.length??``} cartes`})]})]})})}function v(){let e=[],t=new Set(JSON.parse(localStorage.getItem(`flashefc_study_dates`)||`[]`)),n=[`D`,`L`,`M`,`M`,`J`,`V`,`S`];for(let r=6;r>=0;r--){let i=new Date;i.setDate(i.getDate()-r);let a=i.toISOString().split(`T`)[0];e.push({date:a,studied:t.has(a),label:n[i.getDay()]})}let r=e.filter(e=>e.studied).length;return(0,l.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,l.jsx)(`div`,{className:`flex gap-1.5 items-end`,children:e.map((e,t)=>(0,l.jsxs)(`div`,{className:`flex flex-col items-center gap-1`,children:[(0,l.jsx)(`div`,{className:`w-5 h-5 rounded ${e.studied?`bg-foret`:`bg-rule`}`,title:e.date}),(0,l.jsx)(`span`,{className:`text-[10px] text-ink-3`,children:e.label})]},t))}),r>0&&(0,l.jsxs)(`span`,{className:`text-xs text-ink-3`,children:[r,`/7 jours cette semaine`]})]})}function y(){let{user:e}=r(),t=o(),[i,a]=(0,c.useState)([]),[u,d]=(0,c.useState)(!0),f=(0,c.useMemo)(()=>({total:i.reduce((e,t)=>e+t.cardCount,0),due:i.reduce((e,t)=>e+t.due,0),mastered:i.reduce((e,t)=>e+t.mastered,0)}),[i]),[p,m]=(0,c.useState)(``),[h,g]=(0,c.useState)(!1),[y,b]=(0,c.useState)(!1),[x,S]=(0,c.useState)(!1);(0,c.useEffect)(()=>{C()},[]);async function C(){d(!0);let{data:t}=await n.from(`decks`).select(`*, cards(id, next_review_date, repetitions)`).eq(`user_id`,e.id).order(`created_at`,{ascending:!1});if(t){let e=new Date().toISOString().split(`T`)[0];a(t.map(t=>{let n=t.cards||[],r=n.filter(t=>!t.next_review_date||t.next_review_date<=e).length,i=n.filter(e=>e.repetitions>=3).length;return{...t,cardCount:n.length,due:r,mastered:i}}))}d(!1)}async function w(t){t.preventDefault(),p.trim()&&(g(!0),await n.from(`decks`).insert({name:p.trim(),user_id:e.id}),m(``),b(!1),g(!1),C())}function T(){let e=i.find(e=>e.due>0)||i[0];e&&t(`/study/${e.id}`)}function E(){let e=i.filter(e=>e.due>0).length,t=localStorage.getItem(`flashefc_last_studied`),n=``;if(t){let e=Math.floor((Date.now()-new Date(t))/864e5);n=e===0?`Dernière session aujourd'hui.`:e===1?`Dernière session hier.`:`Dernière session il y a ${e} jours.`}return f.due===0?`Tout est à jour. ${f.total} carte${f.total===1?``:`s`} dans votre collection. ${n}`:`Aujourd'hui, ${f.due} carte${f.due===1?``:`s`} à réviser${e>1?` dans ${e} decks`:``}. ${n}`}return u?(0,l.jsx)(`div`,{className:`flex items-center justify-center flex-1`,children:(0,l.jsx)(`div`,{className:`w-6 h-6 border-2 border-rule border-t-foret rounded-full animate-spin`})}):(0,l.jsxs)(`div`,{className:`max-w-4xl mx-auto px-4 w-full`,style:{paddingTop:`80px`,paddingBottom:`80px`},children:[x&&(0,l.jsx)(_,{onClose:()=>S(!1),onImported:C}),(0,l.jsxs)(`div`,{className:`mb-10`,children:[(0,l.jsx)(`h1`,{className:`font-display font-semibold text-foret mb-4`,style:{fontSize:`52px`,lineHeight:`1.05`,letterSpacing:`-0.5px`},children:`Votre maison d'étude.`}),i.length>0&&(0,l.jsx)(`p`,{className:`font-display text-ink-2 mb-6`,style:{fontSize:`20px`,fontStyle:`italic`,lineHeight:`1.5`},children:E()}),(0,l.jsx)(v,{})]}),(0,l.jsxs)(`div`,{className:`flex items-center gap-3 mb-8 flex-wrap`,children:[f.due>0&&(0,l.jsx)(`button`,{onClick:T,className:`bg-foret text-ivoire text-sm px-5 py-3 rounded-[18px] hover:brightness-90 transition-all font-bold`,children:`Démarrer une session`}),(0,l.jsx)(`button`,{onClick:()=>S(!0),className:`border border-foret text-foret text-sm px-4 py-2.5 rounded-[18px] hover:bg-foret/5 transition-colors font-bold`,children:`Importer`}),(0,l.jsx)(`button`,{onClick:()=>b(!y),className:`border border-foret text-foret text-sm px-4 py-2.5 rounded-[18px] hover:bg-foret/5 transition-colors font-bold`,children:`+ Nouveau deck`})]}),y&&(0,l.jsxs)(`form`,{onSubmit:w,className:`bg-ivoire-2 border border-rule rounded-2xl p-5 mb-6 flex gap-3`,children:[(0,l.jsx)(`input`,{autoFocus:!0,type:`text`,value:p,onChange:e=>m(e.target.value),placeholder:`Nom du deck…`,className:`flex-1 border-b border-rule bg-transparent text-ink text-sm py-1.5 focus:outline-none focus:border-foret transition-colors placeholder:text-ink-3`}),(0,l.jsx)(`button`,{type:`submit`,disabled:h||!p.trim(),className:`bg-foret text-ivoire text-sm px-4 py-2 rounded-[18px] hover:brightness-90 disabled:opacity-40 transition-all font-bold`,children:`Créer`}),(0,l.jsx)(`button`,{type:`button`,onClick:()=>b(!1),className:`text-sm px-3 py-2 text-ink-3 hover:text-ink transition-colors`,children:`Annuler`})]}),i.length===0?(0,l.jsxs)(`div`,{className:`text-center py-20 text-ink-3`,children:[(0,l.jsx)(`p`,{className:`font-display text-2xl mb-3`,style:{fontStyle:`italic`},children:`Collection vide.`}),(0,l.jsx)(`p`,{className:`text-sm`,children:`Créez votre premier deck ou importez un fichier Excel, CSV, PowerPoint ou Word.`})]}):(0,l.jsx)(`div`,{className:`grid gap-4 sm:grid-cols-2`,children:i.map(e=>(0,l.jsxs)(`div`,{className:`bg-ivoire-2 border border-rule rounded-2xl p-6 hover:border-laiton transition-colors`,style:{boxShadow:`0 12px 28px -16px rgba(28,24,20,0.18)`},children:[(0,l.jsxs)(`div`,{className:`flex items-start justify-between mb-1`,children:[(0,l.jsx)(s,{to:`/decks/${e.id}`,children:(0,l.jsx)(`h3`,{className:`font-display font-semibold text-foret hover:text-laiton transition-colors`,style:{fontSize:`22px`,lineHeight:`1.1`},children:e.name})}),e.due>0&&(0,l.jsxs)(`span`,{className:`text-[11px] font-bold uppercase tracking-[1.5px] text-seal border border-seal/40 px-2 py-0.5 rounded-full ml-3 shrink-0`,children:[e.due,` à réviser`]})]}),(0,l.jsxs)(`p`,{className:`text-xs font-bold uppercase tracking-[2px] text-ink-3 mb-4`,children:[e.cardCount,` carte`,e.cardCount===1?``:`s`,` · `,e.mastered,` maîtrisée`,e.mastered===1?``:`s`]}),e.cardCount>0&&(0,l.jsx)(`div`,{className:`bg-rule rounded-full h-px mb-4`,children:(0,l.jsx)(`div`,{className:`bg-foret h-px rounded-full transition-all`,style:{width:`${Math.round(e.mastered/e.cardCount*100)}%`}})}),(0,l.jsx)(s,{to:`/study/${e.id}`,className:`inline-block bg-foret text-ivoire text-xs font-bold uppercase tracking-[1px] px-4 py-2 rounded-[18px] hover:brightness-90 transition-all`,children:`Étudier`})]},e.id))})]})}export{y as default};