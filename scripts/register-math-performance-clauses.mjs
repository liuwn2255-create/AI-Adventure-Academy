import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`);
const page = '肆／學習重點／一、學習表現／依學習階段排序之學習表現';
const rows = [
  ['n-I-1','理解一千以內數的位值結構，據以做為四則運算之基礎。',1],
  ['n-I-2','理解加法和減法的意義，熟練基本加減法並能流暢計算。',1],
  ['n-I-3','應用加法和減法的計算或估算於日常應用解題。',1],
  ['n-I-4','理解乘法的意義，熟練十十乘法，並初步進行分裝與平分的除法活動。',1],
  ['n-I-5','在具體情境中，解決簡單兩步驟應用問題。',1],
  ['n-I-6','認識單位分數。',1],
  ['n-I-7','理解長度及其常用單位，並做實測、估測與計算。',1],
  ['n-I-8','認識容量、重量、面積。',1],
  ['n-I-9','認識時刻與時間常用單位。',1],
  ['s-I-1','從操作活動，初步認識物體與常見幾何形體的幾何特徵。',1],
  ['r-I-1','學習數學語言中的運算符號、關係符號、算式約定。',1],
  ['r-I-2','認識加法和乘法的運算規律。',1],
  ['r-I-3','認識加減互逆，並能應用與解題。',1],
  ['d-I-1','認識分類的模式，能主動蒐集資料、分類，並做簡單的呈現與說明。',1],
  ['n-II-1','理解一億以內數的位值結構，並據以作為各種運算與估算之基礎。',2],
  ['n-II-2','熟練較大位數之加、減、乘計算或估算，並能應用於日常解題。',2],
  ['n-II-3','理解除法的意義，能做計算與估算，並能應用於日常解題。',2],
  ['n-II-4','解決四則估算之日常應用問題。',2],
  ['n-II-5','在具體情境中，解決兩步驟應用問題。',2],
  ['n-II-6','理解同分母分數的加、減、整數倍的意義、計算與應用。認識等值分數的意義，並應用於認識簡單異分母分數之比較與加減的意義。',2],
  ['n-II-7','理解小數的意義與位值結構，並能做加、減、整數倍的直式計算與應用。',2],
  ['n-II-8','能在數線標示整數、分數、小數並做比較與加減，理解整數、分數、小數都是數。',2],
  ['n-II-9','理解長度、角度、面積、容量、重量的常用單位與換算，培養量感與估測能力，並能做計算和應用解題。認識體積。',2],
  ['n-II-10','理解時間的加減運算，並應用於日常的時間加減問題。',2],
  ['s-II-1','理解正方形和長方形的面積與周長公式與應用。',2],
  ['s-II-2','認識平面圖形全等的意義。',2],
  ['s-II-3','透過平面圖形的構成要素，認識常見三角形、常見四邊形與圓。',2],
  ['s-II-4','在活動中，認識幾何概念的應用，如旋轉角、展開圖與空間形體。',2],
  ['r-II-1','理解乘除互逆，並能應用與解題。',2],
  ['r-II-2','認識一維及二維之數量模式，並能說明與簡單推理。',2],
  ['r-II-3','理解兩步驟問題的併式計算與四則混合計算之約定。',2],
  ['r-II-4','認識兩步驟計算中加減與部分乘除計算的規則並能應用。',2],
  ['r-II-5','理解以文字表示之數學公式。',2],
  ['d-II-1','報讀與製作一維表格、二維表格與長條圖，報讀折線圖，並據以做簡單推論。',2],
  ['n-III-1','理解數的十進位的位值結構，並能據以延伸認識更大與更小的數。',3],
  ['n-III-2','在具體情境中，解決三步驟以上之常見應用問題。',3],
  ['n-III-3','認識因數、倍數、質數、最大公因數、最小公倍數的意義、計算與應用。',3],
  ['n-III-4','理解約分、擴分、通分的意義，並應用於異分母分數的加減。',3],
  ['n-III-5','理解整數相除的分數表示的意義。',3],
  ['n-III-6','理解分數乘法和除法的意義、計算與應用。',3],
  ['n-III-7','理解小數乘法和除法的意義，能做直式計算與應用。',3],
  ['n-III-8','理解以四捨五入取概數，並進行合理估算。',3],
  ['n-III-9','理解比例關係的意義，並能據以觀察、表述、計算與解題，如比率、比例尺、速度、基準量等。',3],
  ['n-III-10','嘗試將較複雜的情境或模式中的數量關係以算式正確表述，並據以推理或解題。',3],
  ['n-III-11','認識量的常用單位及其換算，並處理相關的應用問題。',3],
  ['n-III-12','理解容量、容積和體積之間的關係，並做應用。',3],
  ['s-III-1','理解三角形、平行四邊形與梯形的面積計算。',3],
  ['s-III-2','認識圓周率的意義，理解圓面積、圓周長、扇形面積與弧長之計算方式。',3],
  ['s-III-3','從操作活動，理解空間中面與面的關係與簡單立體形體的性質。',3],
  ['s-III-4','理解角柱（含正方體、長方體）與圓柱的體積與表面積的計算方式。',3],
  ['s-III-5','以簡單推理，理解幾何形體的性質。',3],
  ['s-III-6','認識線對稱的意義與其推論。',3],
  ['s-III-7','認識平面圖形縮放的意義與應用。',3],
  ['r-III-1','理解各種計算規則（含分配律），並協助四則混合計算與應用解題。',3],
  ['r-III-2','熟練數（含分數、小數）的四則混合計算。',3],
  ['r-III-3','觀察情境或模式中的數量關係，並用文字或符號正確表述，協助推理與解題。',3],
  ['d-III-1','報讀圓形圖，製作折線圖與圓形圖，並據以做簡單推論。',3],
  ['d-III-2','能從資料或圖表的資料數據，解決關於「可能性」的簡單問題。',3],
];

const audit = read('curriculum/math-focused-clause-audit.json');
const registry = read('curriculum/sources.json');
const mathSource = registry.sources.find(({ id }) => id === 'mathematics');
const entries = rows.map(([code, officialText, stage]) => ({
  code,
  officialText,
  learningStage: stage === 1 ? '第一學習階段（一、二年級）' : stage === 2 ? '第二學習階段（三、四年級）' : '第三學習階段（五、六年級）',
  sourceLocation: `${page}，${stage === 3 ? 'PDF頁序12' : 'PDF頁序11'}；原文只定義學習階段，並不指定學期或教材順序。`,
  reviewStatus: 'verified_against_official_pdf_this_run',
}));
audit.learningPerformanceClauses = entries;
audit.performanceClauseAudit = {
  status: 'all_elementary_stage_learning_performance_rows_enumerated_from_official_pdf',
  verifiedCount: entries.length,
  byStage: Object.fromEntries([1, 2, 3].map((stage) => [stage, entries.filter(({ learningStage }) => learningStage.startsWith(['', '第一', '第二', '第三'][stage])).length])),
  sourceLocation: '伍／一／依學習階段排序之學習表現；第一、二學習階段 PDF頁序11，第三學習階段 PDF頁序12。',
  note: '本批次完整列入官方國小第一至第三學習階段的學習表現條文；不是學習內容總清冊，不表示對應活動完整或教學已完成。',
};
for (const { code } of entries) if (!mathSource.verifiedClauses.includes(code)) mathSource.verifiedClauses.push(code);
mathSource.verifiedClauseTypes ??= {};
mathSource.verifiedClauseTypes.stage_performance = entries.map(({ code }) => code);
mathSource.reviewStatus = 'elementary_learning_performance_fully_enumerated_learning_content_partial';
mathSource.reviewDate = '2026-10-23';
const performanceNote = '本輪另以官方PDF伍／一逐階段表格核對國小第一、二、三學習階段全部58條學習表現（PDF頁序11–12）；學習內容各年級表仍僅完成局部條目，故全領綱清冊仍未完成。';
mathSource.pageOrSection = `${mathSource.pageOrSection.replaceAll(performanceNote, '').trim()} ${performanceNote}`;
write('curriculum/math-focused-clause-audit.json', audit);
write('curriculum/sources.json', registry);
console.log(JSON.stringify({ performanceClauseCount: entries.length, byStage: audit.performanceClauseAudit.byStage, sourceStatus: mathSource.reviewStatus }, null, 2));
