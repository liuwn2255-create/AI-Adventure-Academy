import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { G4_SOCIAL_DIFFERENT_VIEWPOINTS } from '../prototype/data/crossGradeGapFillTasks.js';
import { buildOfficialLearningItemCrosswalk, validateOfficialLearningItemCrosswalk } from '../scripts/official-learning-item-activity-crosswalk.mjs';

const read = (filename) => JSON.parse(fs.readFileSync(new URL(filename, import.meta.url), 'utf8'));

test('INe-II bounded source batch preserves all 11 verified official rows, page boundary, and stage-only applicability', () => {
  const batch = read('../curriculum/natural-science-stage2-ine-official-content-batch.json');
  const sourceData = read('../curriculum/sources.json');
  const subitems = read('../curriculum/learning-subitem-definitions.json');
  const curriculum = read('../curriculum/curriculum-map.json');
  assert.equal(batch.status, 'verified_bounded_official_content_subsection_not_full_document_inventory');
  assert.equal(batch.sourceLocation, '伍／二／課題2 自然界的現象、規律及作用／交互作用（INe）第二學習階段欄，PDF頁序23–24、文件印刷頁碼19–20。');
  assert.deepEqual(batch.clauses.map(({ code }) => code), Array.from({ length: 11 }, (_, index) => `INe-Ⅱ-${index + 1}`));
  assert.ok(batch.clauses.every((row) => row.itemType === 'learning_content' && row.learningStage.includes('第二學習階段') && row.reviewStatus.startsWith('verified_against_official_pdf')));
  assert.equal(batch.clauses.at(-1).officialText, '環境的變化會影響植物生長。');
  assert.equal(batch.clauses.at(-1).pdfPageSequence, 24);
  assert.ok(batch.clauses.slice(0, -1).every((row) => row.pdfPageSequence === 23));
  assert.ok(batch.clauses.every((row) => row.relatedPerformanceCodes.length === 0), 'do not infer per-row performance links that the table does not state');
  const scienceSource = sourceData.sources.find(({ id }) => id === 'natural-science');
  assert.ok(scienceSource.verifiedClauses.includes('INe-Ⅱ-11'));
  assert.equal(scienceSource.verifiedContentBatches.filter(({ batchId }) => batchId === batch.batchId).length, 1);
  const ineSubitems = subitems.definitions.filter((definition) => definition.officialCode?.startsWith('INe-Ⅱ-'));
  assert.equal(ineSubitems.length, 21, 'project concept decompositions are distinct from 11 official rows');
  assert.ok(ineSubitems.slice(0, 18).every((definition) => definition.status === 'inventory_only_not_implemented' && definition.activityIds.length === 0));
  assert.ok(ineSubitems.slice(18).every((definition) => definition.status === 'candidate_partial_interaction'
    && definition.activityIds.length === 1
    && definition.activityIds[0] === 'ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE'));
  const focusRows = [...curriculum.verifiedLearningFocuses, ...curriculum.supplementalVerifiedLearningFocuses, ...curriculum.pendingLearningFocuses];
  for (const row of batch.clauses) {
    const focus = focusRows.find(({ contentCodes }) => contentCodes?.includes(row.code));
    assert.ok(focus, `parent focus missing for ${row.code}`);
    assert.equal(focus.gradeApplicabilityStatus, 'official_stage_only_not_individual_grade');
    assert.equal(focus.gradeRange, null);
  }
});

test('Ba-II-1 social slice has specific candidate comparison evidence and keeps the uncovered real-world limits', () => {
  const batch = read('../curriculum/social-studies-stage2-ba-official-content-batch.json');
  const report = buildOfficialLearningItemCrosswalk();
  assert.deepEqual(validateOfficialLearningItemCrosswalk(report).errors, []);
  assert.equal(batch.clauses.length, 1);
  assert.equal(batch.clauses[0].officialText, '人們對社會事物的認識、感受與意見有相同之處，亦有差異性。');
  assert.equal(batch.clauses[0].pdfPageSequence, 100);
  assert.equal(batch.clauses[0].printedPage, 96);
  assert.equal(batch.clauses[0].activityEvidenceStatus, 'partial');
  const socialFocusStage = G4_SOCIAL_DIFFERENT_VIEWPOINTS.stages.find(({ stageId }) => stageId === 'compare-shared-and-different-viewpoints');
  assert.ok(socialFocusStage);
  assert.equal(G4_SOCIAL_DIFFERENT_VIEWPOINTS.status, 'candidate_pending_teacher_review');
  assert.equal(G4_SOCIAL_DIFFERENT_VIEWPOINTS.teacherReview.status, 'not_reviewed');
  assert.equal(socialFocusStage.interaction, 'classify_observations');
  assert.equal(Object.keys(socialFocusStage.correctAssignments).length, 4);
  assert.equal(socialFocusStage.hints.length, 2);
  const reportSlice = report.verifiedNonMathOfficialContentSlices.find(({ batchId }) => batchId === batch.batchId);
  assert.equal(reportSlice.items[0].activityEvidenceStatus, 'partial');
  assert.ok(reportSlice.items[0].activityEvidence[0].interactionStages.some(({ stageId }) => stageId === socialFocusStage.stageId));
  assert.equal(reportSlice.items[0].activityEvidence[0].browserFlowAcceptance.status, 'passed_three_viewports_this_turn');
  assert.equal(reportSlice.items[0].activityEvidence[0].browserFlowAcceptance.reportPath, 'artifacts/social-ba2-browser-acceptance-20261025/acceptance-report.json');
  assert.ok(batch.clauses[0].limitations.some((limitation) => limitation.includes('訪談')));
  assert.equal(report.scope.officialElementaryItemTotal, null);
  assert.equal(report.scope.fullyEnumeratedOfficialDocumentFamilyCount, 0);
});
