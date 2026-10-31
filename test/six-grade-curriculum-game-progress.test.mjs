import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSixGradeProgress, validateSixGradeProgress } from '../scripts/six-grade-curriculum-game-progress.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('six-grade progress ledger derives separate official, focus and activity counts without inventing denominator', () => {
  const progress = buildSixGradeProgress();
  assert.deepEqual(validateSixGradeProgress(progress), []);
  assert.equal(progress.totals.officialElementaryDocumentFamilyCount, 15);
  assert.equal(progress.totals.fullyEnumeratedOfficialDocumentFamilyCount, 0);
  assert.equal(progress.totals.registeredMathLearningContentRows, 131);
  assert.equal(progress.totals.registeredMathPerformanceRowCount, 58);
  assert.equal(progress.totals.registeredProjectFocusCount, 149);
  assert.equal(progress.totals.registeredActivityCount, 152);
  assert.equal(progress.totals.officialElementaryLearningItemTotal, null);
  assert.equal(progress.totals.nationalCoverageRate, null);
  assert.equal(progress.gradeSubjectProgress.length, 66);
  assert.ok(progress.gradeSubjectProgress.every((slot) => slot.grade >= 1 && slot.grade <= 6));
});

test('math crosswalk rows preserve source, official wording, stage, activities and bounded coverage evidence', () => {
  const progress = buildSixGradeProgress();
  const item = progress.mathOfficialLearningContentItems.find((row) => row.officialCode === 'D-3-1');
  assert.ok(item);
  assert.ok(item.officialText);
  assert.ok(item.sourceUrl.startsWith('https://'));
  assert.ok(item.sourceLocation);
  assert.ok(item.learningStage);
  assert.ok(item.activityIds.length > 0);
  assert.ok(['partial', 'relation_only', 'uncovered', 'needs_verification'].includes(item.coverageStatus));
});

test('progress validates unique activity routing and never promotes candidate activities to teacher-approved', () => {
  const progress = buildSixGradeProgress();
  const activities = progress.gradeSubjectProgress.flatMap((slot) => slot.activities);
  assert.equal(new Set(activities.map((activity) => activity.activityId)).size, 152);
  assert.ok(activities.every((activity) => activity.status === 'candidate_pending_teacher_review'));
  assert.ok(progress.sources.documentFamilies.some((family) => family.clauseEnumerationStatus !== 'fully_enumerated'));
});

test('the current ledger traces the money task and bounded INb slice without upgrading family completeness', () => {
  const progress = buildSixGradeProgress();
  const money = progress.gameChangesThisTurn.find((activity) => activity.activityId === 'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE');
  assert.ok(money);
  assert.equal(money.candidateStatus, 'candidate_pending_teacher_review');
  assert.equal(money.teacherReviewStatus, 'not_reviewed');
  assert.equal(money.coverage, 'partial');
  assert.equal(money.browserAcceptanceStatus, 'passed_1366x768_390x844_340x740');
  const inb = progress.verifiedNonMathOfficialContentSlices.find((slice) => slice.batchId === 'natural-science-stage2-inb-content-slice-pdf-page-20');
  assert.ok(inb);
  assert.equal(inb.officialContentRowCount, 7);
  assert.equal(inb.items.filter((item) => item.activityEvidenceStatus === 'partial').length, 3);
  assert.equal(inb.items.filter((item) => item.activityEvidenceStatus === 'relation_only').length, 1);
  assert.equal(inb.items.filter((item) => item.activityEvidenceStatus === 'uncovered').length, 3);
  assert.equal(progress.totals.fullyEnumeratedOfficialDocumentFamilyCount, 0);
});

test('progress separates verified natural-science bounded rows and social slice from project subitems and document-family completion', () => {
  const progress = buildSixGradeProgress();
  assert.equal(progress.totals.registeredNaturalScienceOfficialLearningContentRows, 55);
  assert.equal(progress.totals.registeredSocialStudiesOfficialLearningContentRows, 2);
  assert.equal(progress.totals.registeredNonMathBoundedOfficialContentSliceRows, 57);
  assert.equal(progress.totals.registeredNaturalScienceProjectSubitemDefinitionCount, 35);
  assert.equal(progress.totals.fullyEnumeratedOfficialDocumentFamilyCount, 0);
  assert.deepEqual(progress.totals.naturalScienceBoundedSliceCountsByBatch.map(({ officialContentRowCount }) => officialContentRowCount), [8, 7, 10, 9, 11, 10]);
  assert.deepEqual(progress.totals.socialStudiesBoundedSliceCountsByBatch.map(({ officialContentRowCount }) => officialContentRowCount), [1, 1]);
  assert.deepEqual(progress.totals.nonMathBoundedSliceCoverageCounts, { partial: 8, relation_only: 20, uncovered: 29, needs_verification: 0 });
  assert.equal(progress.naturalScienceReviewThisTurn.batches.reduce((sum, batch) => sum + batch.completeOfficialTextRows, 0), 55);
  assert.equal(progress.naturalScienceReviewThisTurn.fullyEnumeratedDocumentFamilyCount, 0);
  assert.ok(progress.projectFocuses.filter((focus) => focus.focusId.startsWith('science-stage2-')).every((focus) => focus.learningStage.includes('第二學習階段') && focus.gradeRange === null), 'official stage-only content must not be assigned to an individual grade');
  assert.equal(progress.naturalScienceReviewThisTurn.batches[2].printedPageRange.join('–'), '16–17');
  assert.equal(progress.naturalScienceReviewThisTurn.batches[3].printedPageRange.join('–'), '17–18');
  assert.equal(progress.naturalScienceReviewThisTurn.batches[4].pdfPageSequenceRange.join('–'), '23–24');
  assert.equal(progress.naturalScienceReviewThisTurn.batches[4].printedPageRange.join('–'), '19–20');
  assert.equal(progress.naturalScienceReviewThisTurn.batches[4].completeOfficialTextRows, 11);
  assert.equal(progress.socialStudiesReviewThisTurn.officialContentRowCount, 1);
  assert.deepEqual(progress.socialStudiesReviewThisTurn.coverageStatusCounts, { partial: 1 });
  assert.equal(progress.socialStudiesReviewThisTurn.browserAcceptance.status, 'passed_three_viewports_this_turn');
  assert.equal(progress.socialStudiesReviewThisTurn.browserAcceptance.reportPath, 'artifacts/social-ba2-browser-acceptance-20261025/acceptance-report.json');
  assert.equal(progress.socialStudiesReviewThisTurn.fullyEnumeratedDocumentFamilyCount, 0);
  assert.equal(typeof progress.socialStudiesReviewThisTurn.nextPosition, 'string');
  assert.ok(progress.socialStudiesReviewThisTurn.nextPosition.length > 0);
  assert.ok(progress.socialStudiesReviewThisTurn.nextPosition.includes('尚未逐條核讀'));
  assert.ok(progress.socialStudiesReviewThisTurn.nextPosition.includes('不預設下一個代碼'));
  assert.ok(!progress.socialStudiesReviewThisTurn.nextPosition.includes('Bb-Ⅱ-1'));
  const inc = progress.verifiedNonMathOfficialContentSlices.find((slice) => slice.batchId === 'natural-science-stage2-inc-content-slice-pdf-pages-20-21');
  const ind = progress.verifiedNonMathOfficialContentSlices.find((slice) => slice.batchId === 'natural-science-stage2-ind-content-slice-pdf-pages-21-22');
  assert.equal(inc.items[0].pdfPageSequence, 20);
  assert.equal(inc.items.at(-1).pdfPageSequence, 21);
  assert.equal(ind.items[0].printedPage, 17);
  assert.match(ind.items[0].sourceLocation, /印刷頁碼17–18/u);
  assert.match(progress.moneyTaskAuditThisTurn.reasonNoChange, /partial/u);
  assert.equal(progress.moneyTaskAuditThisTurn.coverage, 'partial');
  assert.equal(progress.moneyTaskAuditThisTurn.candidateStatus, 'candidate_pending_teacher_review');
  assert.ok(progress.moneyTaskAuditThisTurn.uncovered.some((item) => item.includes('找零')));
});

test('historical math batches remain separate and current-turn official PDF verification records grades 4–6', () => {
  const progress = buildSixGradeProgress();
  const review = progress.priorMathTableReviews;
  assert.equal(review.status, 'historical_verified_batches');
  const grade1 = review.batchesReviewed.find((batch) => batch.officialGradeTable === 1);
  const grade2 = review.batchesReviewed.find((batch) => batch.officialGradeTable === 2);
  const grade3 = review.batchesReviewed.find((batch) => batch.officialGradeTable === 3);
  for (const [batch, filename] of [[grade1, 'math-grade1-official-content-batch.json'], [grade2, 'math-grade2-official-content-batch.json'], [grade3, 'math-grade3-official-content-batch.json']]) {
    assert.ok(batch);
    const localBatch = JSON.parse(fs.readFileSync(path.join(root, 'curriculum', filename), 'utf8'));
    const crosswalkRows = progress.mathOfficialLearningContentItems.filter((item) => item.officialGradeTable === batch.officialGradeTable);
    assert.equal(localBatch.clauses.length, batch.officialCodeRowsReviewed);
    assert.equal(crosswalkRows.length, batch.officialCodeRowsReviewed);
    for (const clause of localBatch.clauses) {
      assert.equal(crosswalkRows.find((item) => item.officialCode === clause.code)?.officialText, clause.officialText);
    }
    assert.match(batch.batchCrosswalkComparison, /一致/);
  }
  assert.equal(grade1.pdfPageSequence.startsWith('P21–P22'), true);
  assert.equal(grade1.distinctConceptsUnderExplicitEquivalentCodeRule, 10);
  assert.deepEqual(grade1.retainedEquivalentCodes, ['N-1-5', 'S-1-1']);
  assert.equal(grade2.pdfPageSequence.startsWith('P22–P25'), true);
  assert.equal(grade2.distinctConceptsUnderExplicitEquivalentCodeRule, 24);
  assert.deepEqual(grade2.explicitEquivalentCodeAliases, []);
  assert.equal(review.localPdfFilesFound, 0);
  assert.equal(progress.officialPDFReviewThisTurn.status, 'partial_verified_grade_table');
  const grade4 = progress.officialPDFReviewThisTurn.batchesReviewed.find((batch) => batch.officialGradeTable === 4);
  assert.ok(grade4);
  const grade4Batch = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/math-grade4-official-content-batch.json'), 'utf8'));
  const grade4Crosswalk = progress.mathOfficialLearningContentItems.filter((item) => item.officialGradeTable === 4);
  assert.equal(grade4.officialCodeRowsReviewed, 26);
  assert.equal(grade4.distinctConceptsUnderExplicitEquivalentCodeRule, 25);
  assert.equal(grade4Batch.clauses.length, 26);
  assert.equal(grade4Crosswalk.length, 26);
  for (const clause of grade4Batch.clauses) {
    assert.equal(grade4Crosswalk.find((item) => item.officialCode === clause.code)?.officialText, clause.officialText);
  }
  for (const [gradeNumber, expectedRows, expectedConcepts, expectedLocation] of [
    [5, 27, 27, 'P31–P34'],
    [6, 19, 18, 'P35–P37'],
  ]) {
    const reviewed = progress.officialPDFReviewThisTurn.batchesReviewed.find((batch) => batch.officialGradeTable === gradeNumber);
    const batch = JSON.parse(fs.readFileSync(path.join(root, `curriculum/math-grade${gradeNumber}-official-content-batch.json`), 'utf8'));
    const crosswalkRows = progress.mathOfficialLearningContentItems.filter((item) => item.officialGradeTable === gradeNumber);
    assert.ok(reviewed, `grade ${gradeNumber} official table must be recorded as rechecked this turn`);
    assert.equal(reviewed.officialCodeRowsReviewed, expectedRows);
    assert.equal(reviewed.distinctConceptsUnderExplicitEquivalentCodeRule, expectedConcepts);
    assert.ok(reviewed.pdfPageSequence.startsWith(expectedLocation));
    assert.equal(batch.clauses.length, expectedRows);
    assert.equal(crosswalkRows.length, expectedRows);
    for (const clause of batch.clauses) {
      assert.equal(crosswalkRows.find((item) => item.officialCode === clause.code)?.officialText, clause.officialText);
    }
    assert.match(reviewed.batchCrosswalkComparison, /未缺列且原文一致/u);
  }
  const grade6Relations = progress.mathOfficialLearningContentItems.filter((item) => item.officialGradeTable === 6 && ['N-6-9', 'R-6-4'].includes(item.officialCode));
  assert.equal(grade6Relations.length, 2, 'retain both official codes even though N-6-9 explicitly says same content as R-6-4');
  assert.equal(progress.officialPDFReviewThisTurn.fullyEnumeratedFamilyCount, 0);
  assert.equal(progress.officialPDFReviewThisTurn.fullyEnumeratedFamilyCount, 0);
  assert.equal(progress.totals.fullyEnumeratedOfficialDocumentFamilyCount, 0);
});
