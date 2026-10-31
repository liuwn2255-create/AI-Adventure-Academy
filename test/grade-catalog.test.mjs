import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GRADE_CATALOG, GRADE_SUBJECT_IDS, validateGradeCatalog } from '../prototype/data/gradeCatalog.js';
import { CATALOG_CANDIDATE_TASKS } from '../prototype/data/catalogCandidateTasks.js';

const registry = JSON.parse(await readFile(new URL('../curriculum/unit-registry.json', import.meta.url), 'utf8'));

test('出版社中立年級目錄完整建立一至六年級、上下學期與國小領域索引入口', () => {
  assert.deepEqual(validateGradeCatalog(), []);
  assert.deepEqual(GRADE_CATALOG.map(({ gradeId }) => gradeId), [
    'grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5', 'grade-6',
  ]);

  for (const grade of GRADE_CATALOG) {
    assert.ok(grade.name);
    assert.ok(grade.developmentStatus);
    assert.equal(grade.semesters.length, 2);
    assert.deepEqual(grade.subjects.map(({ subjectId }) => subjectId), GRADE_SUBJECT_IDS);
    for (const subject of grade.subjects) {
      assert.equal(subject.semesterSlots.length, 2);
      for (const slot of subject.semesterSlots) {
        assert.ok(Array.isArray(slot.units));
        assert.ok(Array.isArray(slot.levels));
        assert.ok(Array.isArray(slot.questionData));
        assert.ok(slot.reviewStatus);
        assert.ok(slot.unlockCondition);
        assert.equal(slot.progressDataInterface.status, 'specification_only_not_implemented');
      }
    }
  }
});

test('二年級有局部候選入口，其餘未建置年級與學期仍保留待確認', () => {
  const candidateTaskIds = new Set(CATALOG_CANDIDATE_TASKS.map(({ activityId }) => activityId));
  for (const grade of GRADE_CATALOG.filter(({ gradeNumber }) => gradeNumber !== 3)) {
    const hasPartialCandidateContent = grade.subjects.some(({ existingYearLevelContent }) => existingYearLevelContent.length > 0);
    assert.equal(grade.developmentStatus, hasPartialCandidateContent ? 'in_development_partial' : 'preparation');
    assert.equal(grade.curriculumApplicabilityStatus, hasPartialCandidateContent ? 'partial_official_scope_recorded_local_schedule_pending' : 'pending_official_grade_scope_verification');
    for (const semester of grade.semesters) assert.equal(semester.status, 'schedule_not_confirmed');
    for (const subject of grade.subjects) {
      assert.ok(subject.curriculumApplicabilityStatus.includes('pending'));
      const expectedTasks = CATALOG_CANDIDATE_TASKS.filter((task) => task.gradeId === grade.gradeId && task.subjectId === subject.subjectId);
      assert.deepEqual(subject.existingYearLevelContent.map(({ activityId }) => activityId), expectedTasks.map(({ activityId }) => activityId));
      for (const activity of subject.existingYearLevelContent) {
        assert.ok(candidateTaskIds.has(activity.activityId));
        assert.equal(activity.status, 'candidate_pending_teacher_review');
        assert.equal(activity.semesterId, null);
        assert.equal(activity.semesterAssignmentStatus, 'pending_school_and_teacher_confirmation');
        assert.equal(activity.progressPersistence, 'memory_only_no_student_records_no_localStorage');
      }
      for (const slot of subject.semesterSlots) {
        assert.equal(slot.contentStatus, 'not_assigned');
        assert.equal(slot.reviewStatus, 'not_started');
        assert.deepEqual(slot.units, []);
        assert.deepEqual(slot.levels, []);
        assert.deepEqual(slot.questionData, []);
      }
    }
  }
});

test('三年級既有數學原型保持引用，候選單元仍按真實登錄為 candidate', () => {
  const grade = GRADE_CATALOG[2];
  const math = grade.subjects.find(({ subjectId }) => subjectId === 'mathematics');
  assert.equal(grade.developmentStatus, 'in_development_partial');
  assert.ok(math.existingYearLevelContent.some(({ levelId }) => levelId === 'math-place-value-demo'));
  assert.ok(math.existingYearLevelContent.some(({ levelId }) => levelId === 'number-secret-challenge'));
  assert.ok(math.existingYearLevelContent.some(({ levelId }) => levelId === 'math-capacity-candidate'));
  assert.ok(math.existingYearLevelContent.every(({ semesterId }) => semesterId === null));
  assert.equal(registry.units.find(({ unitId }) => unitId === 'M3-NUM-01')?.status, 'candidate');
  assert.equal(math.unitRefs.find(({ unitId }) => unitId === 'M3-NUM-01')?.registryStatusMustBeReadFromSource, true);
});

test('年級選擇與準備中檢視有入口，首頁不再顯示未依照片製作的人物圖', async () => {
  const html = await readFile(new URL('../prototype/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../prototype/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="grade-options"/);
  assert.match(html, /id="grade-preparation-panel"/);
  assert.match(html, /id="grade-subject-directory"/);
  assert.match(html, /id="grade-subject-detail"/);
  assert.match(html, /角色素材待提供/);
  assert.doesNotMatch(html, /戴著黃色探險帽、背著背包的小小探險家/);
  assert.match(app, /for \(const grade of GRADE_CATALOG\)/);
  assert.match(app, /尚無可啟動的遊戲活動/);
});
