// Local candidate evidence only; never awards formal mastery.
export const LEARNING_PROGRESS_KEY = 'taiwan-ai-adventure.learning-pilot.v1';
export function readLearningPilot(storage) {
  try {
    const x=JSON.parse(storage.getItem(LEARNING_PROGRESS_KEY));
    if(x?.version!==1 || !Array.isArray(x.sessions)) return [];
    return x.sessions.filter(s=>typeof s.id==='string' && typeof s.unit==='string' && Number.isInteger(s.attempts) && s.attempts>=0 && Number.isInteger(s.correct) && s.correct>=0 && s.correct<=s.attempts && typeof s.completed==='boolean').slice(-50);
  } catch { return []; }
}
export function saveLearningPilot(storage, session) {
  if(!session?.sessionId || !session.learningUnitId) return false;
  const attempts=Array.isArray(session.practiceAttempts)?session.practiceAttempts:[];
  const record={id:session.sessionId,unit:session.learningUnitId,attempts:attempts.length,correct:attempts.filter(a=>a.result==='correct').length,completed:session.completedActivityIds?.includes('ACT-M3-NUM-PLACE-VALUE-THOUSANDS-SECRET')===true};
  try {
    const sessions=readLearningPilot(storage).filter(s=>s.id!==record.id);
    storage.setItem(LEARNING_PROGRESS_KEY,JSON.stringify({version:1,sessions:[...sessions,record].slice(-50)}));
    return true;
  } catch {return false;}
}
export function clearLearningPilot(storage){try{storage.removeItem(LEARNING_PROGRESS_KEY);return true;}catch{return false;}}
