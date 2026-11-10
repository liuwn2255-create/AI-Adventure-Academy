import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await page.goto('http://127.0.0.1:4175/');
 await page.evaluate(async()=>{const {saveLearningPilot}=await import('/learningProgressPilot.js');localStorage.setItem('game-test','keep');saveLearningPilot(localStorage,{sessionId:'browser-pilot',learningUnitId:'test-unit',practiceAttempts:[{result:'correct'},{result:'incorrect'}],completedActivityIds:['ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET']});});
 await page.getByRole('link',{name:'我的學習回顧'}).click();
 await page.getByText('練習 2 次，正確 1 次。',{exact:false}).waitFor();
 await page.reload();
 await page.getByText('練習 2 次，正確 1 次。',{exact:false}).waitFor();
 page.once('dialog',d=>d.accept());
 await page.getByRole('button',{name:'清除學習紀錄'}).click();
 await page.getByText('目前沒有學習紀錄。').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('game-test')),'keep');
 await page.getByRole('link',{name:'返回學園'}).click();
 await page.getByRole('link',{name:'我的學習回顧'}).waitFor();
 console.log('UX-01 mobile review persistence, clearing, return PASS');
} finally {await browser.close();}
