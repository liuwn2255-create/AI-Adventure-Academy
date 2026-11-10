import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await page.goto('http://127.0.0.1:4175/');
 await page.evaluate(async()=>{const {saveLearningPilot}=await import('/learningProgressPilot.js');localStorage.setItem('game-test','keep');const {createNumberSecretLearningSession,dispatchLearningUnit}=await import('/learningUnitFlow.js');const {NUMBER_SECRET_LEARNING_UNIT:unit}=await import('/data/numberSecretLearningUnit.js');let s=createNumberSecretLearningSession('browser-pilot');const step=(a,p)=>{const r=dispatchLearningUnit(s,a,p);if(!r.changed)throw Error(a);s=r.session;saveLearningPilot(localStorage,s);};step('start');for(let i=0;i<unit.lessonSteps.length;i++)step('lesson_next');for(const q of unit.practiceQuestions){step('practice_answer',{optionId:q.answerId});step('practice_next');}if(s.phase!=='check_intro')throw Error('practice not complete');});
 await page.getByRole('link',{name:'我的學習回顧'}).click();
 await page.getByText('練習已完成',{exact:false}).waitFor();
 await page.reload();
 await page.getByText('練習已完成',{exact:false}).waitFor();
 page.once('dialog',d=>d.accept());
 await page.getByRole('button',{name:'清除學習紀錄'}).click();
 await page.getByText('目前沒有學習紀錄。').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('game-test')),'keep');
 await page.getByRole('link',{name:'返回學園'}).click();
 await page.getByRole('link',{name:'我的學習回顧'}).waitFor();
 console.log('UX-01 mobile review persistence, clearing, return PASS');
} finally {await browser.close();}
