import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCoverageInventory } from '../scripts/curriculum-coverage.mjs';

const sources = JSON.parse(fs.readFileSync(new URL('../curriculum/sources.json', import.meta.url), 'utf8'));
const inventory = buildCoverageInventory({
  sources,
  curriculumMap: JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8')),
  browserAcceptance: null,
});

test('source inventory distinguishes official document location from full clause enumeration', () => {
  assert.equal(sources.sourceInventory.status, 'incomplete_official_document_and_clause_inventory');
  const sourceIds = sources.sources.map((source) => source.id);
  assert.equal(new Set(sourceIds).size, sourceIds.length, 'source IDs must be unique');
  const familyIds = sources.sourceInventory.documentFamilies.map((family) => family.id);
  assert.equal(new Set(familyIds).size, familyIds.length, 'document family IDs must be unique');
  for (const family of sources.sourceInventory.documentFamilies) {
    for (const sourceId of family.sourceIds) assert.ok(sourceIds.includes(sourceId), `${family.id} references missing ${sourceId}`);
  }

  const summary = inventory.sourceInventory;
  assert.equal(summary.expectedElementaryFormalDocumentFamilyCount, 15);
  assert.equal(summary.expectedElementaryFormalDocumentFamiliesLocated, 15);
  assert.deepEqual(summary.expectedElementaryFormalDocumentFamiliesNotRetrieved, []);
  const index = JSON.parse(fs.readFileSync(new URL('../curriculum/official-language-code-index.json', import.meta.url), 'utf8'));
  assert.equal(index.extractionStatus, 'official_pdf_text_index_extraction_clause_by_clause_review_pending');
  assert.equal(index.documents.length, 3);
  for (const id of ['local-minnan', 'local-hakka', 'local-indigenous']) {
    const source = sources.sources.find((row) => row.id === id);
    assert.equal(source.reviewStatus, 'current_111_official_document_retrieved_elementary_code_index_extracted_clause_review_pending');
    assert.match(source.url, /edu\.law\.moe\.gov\.tw\/LawContent\.aspx/u);
    assert.match(source.attachmentUrl, /Download\.ashx\?FileID=/u);
    assert.equal(source.codeIndexFile, 'curriculum/official-language-code-index.json');
    assert.deepEqual(source.verifiedClauses, [], `${id}: extracted tokens must not be promoted to manually verified clauses`);
    const record = index.documents.find(({ sourceId }) => sourceId === id);
    assert.ok(record);
    assert.ok(record.pdfPageCount > 0);
    assert.ok(record.elementaryCodeReferences.length > 0);
    assert.equal(record.elementaryStageCodeReferenceCount, record.elementaryCodeReferences.length);
    for (const code of record.elementaryCodeReferences) {
      assert.ok(['first', 'second', 'third'].includes(code.learningStage));
      assert.ok(code.pdfPages.every((page) => page >= 1 && page <= record.pdfPageCount));
    }
  }
  assert.equal(summary.clauseEnumeration.extractedElementaryCodeIndexReferenceCount, 209);
  assert.ok(summary.clauseEnumeration.unenumeratedDocuments.length > 0);
});

test('natural science source records the directly rechecked plant clauses and locator', () => {
  const source = sources.sources.find(({ id }) => id === 'natural-science');
  for (const code of ['INb-Ⅱ-4', 'INb-Ⅱ-6', 'INb-Ⅲ-6', 'INb-Ⅲ-7']) assert.ok(source.verifiedClauses.includes(code));
  assert.match(source.pageOrSection, /INb-Ⅱ-4[^。]*101–102/u);
  assert.match(source.pageOrSection, /INb-Ⅱ-6[^。]*103/u);
  const subitem = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'))
    .definitions.find(({ subitemId }) => subitemId === 'SUB-SCIENCE-STAGE2-PLANT-PARTS-AND-EXTERNAL-FORM');
  assert.match(subitem.sourceTextKind, /directly rechecked/u);
  assert.match(subitem.sourceRef.pageOrSection, /INb-Ⅱ-6[^。]*103/u);
  assert.doesNotMatch(subitem.sourceRef.pageOrSection, /INb-Ⅱ-4[^。]*as activity mapping/u);
  for (const [subitemId, code, locator] of [
    ['SUB-SCIENCE-STAGE3-ANIMAL-STRUCTURE-MOVEMENT-RELATION', 'INb-Ⅲ-6', /P103–P104/u],
    ['SUB-SCIENCE-STAGE3-INB3-7-STRUCTURE-FUNCTION', 'INb-Ⅲ-7', /P104–P105/u],
  ]) {
    const entry = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'))
      .definitions.find(({ subitemId: id }) => id === subitemId);
    assert.equal(entry.officialCode, code);
    assert.match(entry.sourceTextKind, /verified_this_run/u);
    assert.match(entry.sourceRef.pageOrSection, locator);
  }
});

test('health and PE inventory preserves the newly checked first-stage safety clause without claiming full enumeration', () => {
  const source = sources.sources.find(({ id }) => id === 'health-physical-education');
  assert.ok(source.verifiedClauses.includes('Ba-Ⅰ-1'));
  assert.match(source.pageOrSection, /Ba-Ⅰ-1/u);
  assert.match(source.pageOrSection, /印刷頁14/u);
  assert.ok(source.verifiedClauses.includes('Bb-Ⅲ-1'));
  const consultSubitem = JSON.parse(fs.readFileSync(new URL('../curriculum/learning-subitem-definitions.json', import.meta.url), 'utf8'))
    .definitions.find(({ subitemId }) => subitemId === 'SUB-HPE-STAGE3-BB3-1-STOP-CHECK-CONSULT');
  assert.match(consultSubitem.sourceRef.pageOrSection, /Bb-Ⅲ-1/u);
  assert.match(consultSubitem.projectSubitem, /不提供藥品或劑量指引/u);
  const focus = JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8'))
    .supplementalVerifiedLearningFocuses.find(({ id }) => id === 'health-pe-stage1-playground-and-school-route-safety');
  assert.ok(focus);
  assert.deepEqual(focus.contentCodes, ['Ba-Ⅰ-1']);
  assert.equal(focus.officialTextReviewStatus, 'verified_against_official_text');
  assert.match(focus.gradeApplicabilityStatus, /not_official_schedule/u);
  const family = inventory.sourceInventory.documentFamilies.find(({ familyId }) => familyId === 'health-pe-guideline');
  assert.equal(family.clauseEnumerationStatus, 'partial_clause_enumeration');
});

test('elementary applicability and exclusions avoid double-counting frameworks and non-elementary domains', () => {
  const byId = new Map(inventory.sourceInventory.documentFamilies.map((family) => [family.familyId, family]));
  assert.equal(byId.get('living-curriculum-guideline').elementaryDenominatorEligible, true);
  assert.equal(byId.get('technology-formal-guideline').elementaryDenominatorEligible, false);
  assert.equal(byId.get('technology-formal-guideline').inventoryCategory, 'formal_document_not_elementary_standalone_denominator');
  for (const id of ['general-guidelines', 'elementary-technology-reference', 'cross-cutting-issues', 'national-defense-education-scope']) {
    assert.equal(byId.get(id).elementaryDenominatorEligible, false, `${id} must not inflate the elementary domain denominator`);
  }
  assert.match(inventory.sourceInventory.exclusions.rule, /生活課程列第一學習階段一次/);
  assert.match(inventory.sourceInventory.exclusions.rule, /跨域課程不另加/);
});

test('coverage report remains incomplete and publishes only registered-focus counts, not a national rate', () => {
  assert.equal(inventory.officialCatalogCompleteness.status, '清冊未完成');
  assert.equal(inventory.officialCatalogCompleteness.officialElementaryLearningItemCount, null);
  assert.equal(inventory.officialCatalogCompleteness.unregisteredOfficialLearningItemCount, null);
  assert.equal(inventory.officialCatalogCompleteness.nationalCoverageRate, null);
  assert.equal(inventory.denominator.count, inventory.registeredCurriculumFocuses.length);
  assert.equal(Object.values(inventory.statusCounts).reduce((sum, count) => sum + count, 0), inventory.denominator.count);
  assert.equal(inventory.denominator.count, 149);
  assert.equal(inventory.statusCounts['已對應'], 0);
  assert.equal(inventory.statusCounts['部分對應'], 101);
  assert.equal(inventory.statusCounts['尚未對應'], 26);
  assert.equal(inventory.statusCounts['待核實'], 22);
  assert.ok(inventory.sourceInventory.clauseEnumeration.unenumeratedDocuments.length > 0);
  assert.ok(inventory.statisticsMethod.registeredFocusStatuses.includes('分母僅為'));
  assert.equal(inventory.candidateActivityDevelopmentReadiness.activityAddedThisRun, true);
  assert.equal(inventory.candidateActivityDevelopmentReadiness.directlyVerifiedUnlinkedFocusCount, 26);
  assert.equal(inventory.candidateActivityDevelopmentReadiness.verifiedPartialLinkedFocusCount, 101);
  assert.equal(inventory.candidateActivityDevelopmentReadiness.learningSubitemExpansionActivityIds.length, 4);
  for (const activityId of [
    'ACT-G4-SCIENCE-PLANT-PARTS-OBSERVATION-CANDIDATE',
    'ACT-G4-SCIENCE-PLANT-EXTERNAL-FORMS-TRANSFER-CANDIDATE',
    'ACT-G5-SCIENCE-FAIR-RULER-METHOD-CANDIDATE',
    'ACT-G4-SCIENCE-MAGNET-INTERACTION-DOCK-CANDIDATE',
  ]) {
    assert.ok(inventory.candidateActivityDevelopmentReadiness.learningSubitemGapExpansionActivityIds.includes(activityId), `${activityId} remains in the gap expansion list`);
  }
  assert.match(inventory.candidateActivityDevelopmentReadiness.decision, /明確子項候選互動/);
  assert.deepEqual(inventory.candidateActivityDevelopmentReadiness.grade3MathDataExpansionActivityIds, [
    'ACT-G3-MATH-CROSS-TABLE-BUILDER-CANDIDATE',
    'ACT-G3-MATH-CROSS-TABLE-INTERPRETER-CANDIDATE',
    'ACT-G3-MATH-CROSS-TABLE-PATTERN-INVESTIGATOR-CANDIDATE',
  ]);
  assert.deepEqual(inventory.candidateActivityDevelopmentReadiness.earlyGradeCurriculumGapActivityIds, [
    'ACT-G1-MATH-SHAPE-COPY-STUDIO-CANDIDATE',
    'ACT-G2-MATH-TWO-STEP-MARKET-CANDIDATE',
    'ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE',
    'ACT-G2-LIVING-RULES-REASON-QUEST-CANDIDATE',
    'ACT-G1-HPE-PLAYGROUND-SAFETY-ROUTE-CANDIDATE',
  ]);
});

test('static task validation is not reported as browser playability evidence', () => {
  const verifiedIds = new Set(inventory.activityPlayabilityInventory.browserVerification.verifiedActivityIds);
  assert.equal(inventory.activityPlayabilityInventory.browserVerification.verifiedActivityCount, 0);
  assert.equal(inventory.activityPlayabilityInventory.catalogCandidateTasks.browserVerified, 0);
  assert.equal(verifiedIds.size, 0);
  assert.equal(inventory.activityPlayabilityInventory.relationActivities.browserVerified, 0);
  assert.equal(inventory.activityPlayabilityInventory.standaloneMathUnits.browserVerified, 0);
  for (const gradeSubject of inventory.gradeSubjectDirectory) {
    const subjectVerifiedIds = gradeSubject.catalogTaskPlayability
      .filter((task) => verifiedIds.has(task.activityId))
      .map((task) => task.activityId);
    assert.equal(gradeSubject.catalogTaskPlayabilityCounts.browserVerified, subjectVerifiedIds.length);
    for (const task of gradeSubject.catalogTaskPlayability) {
      if (verifiedIds.has(task.activityId)) {
        assert.equal(task.runtimeEvidenceStatus, 'browser_verified');
      } else {
        assert.notEqual(task.runtimeEvidenceStatus, 'browser_verified');
        assert.match(task.limitation, /不是瀏覽器操作驗收/);
      }
    }
  }
});

test('verified browser evidence is imported only for activities with successful flows at every required viewport', () => {
  const acceptanceDirectory = new URL('../artifacts/learning-subitems-browser-acceptance/', import.meta.url);
  const expectedIds = [
    'ACT-G1-MATH-LENGTH-COMPARE-ROPE-CANDIDATE',
    'ACT-G5-MATH-LINE-SYMMETRY-MIRROR-GRID-CANDIDATE',
    'ACT-G5-MATH-LINE-CHART-PLOT-CANDIDATE',
  ];
  const reportPaths = [
    new URL('report.json', acceptanceDirectory),
    ...fs.readdirSync(new URL('history/', acceptanceDirectory)).filter((name) => name.endsWith('.json')).map((name) => new URL(`history/${name}`, acceptanceDirectory)),
    ...fs.readdirSync(new URL('runs/', acceptanceDirectory)).filter((name) => fs.existsSync(new URL(`runs/${name}/report.json`, acceptanceDirectory))).map((name) => new URL(`runs/${name}/report.json`, acceptanceDirectory)),
  ];
  const browserAcceptance = reportPaths.map((filename) => JSON.parse(fs.readFileSync(filename, 'utf8')))
    .find((report) => report.status === 'passed' && expectedIds.every((activityId) => report.viewports.every(({ tasks }) => tasks.some((task) => task.activityId === activityId && task.status === 'passed'))));
  assert.ok(browserAcceptance, 'a successful stored browser run for the three evidence-sample activities must be available');
  const withBrowserEvidence = buildCoverageInventory({ sources, curriculumMap: JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8')), browserAcceptance });
  assert.equal(withBrowserEvidence.activityPlayabilityInventory.browserVerification.verifiedActivityCount, expectedIds.length);
  assert.deepEqual(withBrowserEvidence.activityPlayabilityInventory.browserVerification.verifiedActivityIds.sort(), [...expectedIds].sort());
  for (const id of expectedIds) {
    const entry = withBrowserEvidence.activityPlayabilityInventory.catalogCandidateTasks.activities.find(({ activityId }) => activityId === id);
    assert.equal(entry.browserVerified, true);
    assert.equal(entry.browserVerification.evidenceId, browserAcceptance.reportId);
    assert.deepEqual(entry.browserVerification.viewports, ['1366x768', '390x844', '340x740']);
  }
  const rejected = buildCoverageInventory({ sources, curriculumMap: JSON.parse(fs.readFileSync(new URL('../curriculum/curriculum-map.json', import.meta.url), 'utf8')), browserAcceptance: { ...browserAcceptance, status: 'failed' } });
  assert.equal(rejected.activityPlayabilityInventory.browserVerification.verifiedActivityCount, 0);
});

test('coverage imports timestamped browser runs without dropping prior evidence or overstating the new task', () => {
  const aggregated = buildCoverageInventory();
  const task = aggregated.activityPlayabilityInventory.catalogCandidateTasks.activities
    .find(({ activityId }) => activityId === 'ACT-G4-SCIENCE-PLANT-EXTERNAL-FORMS-TRANSFER-CANDIDATE');
  assert.equal(task.browserVerified, true);
  assert.equal(task.browserVerification.browser, 'Edg/155.0.4283.45');
  assert.match(task.browserVerification.source, /artifacts\/learning-subitems-browser-acceptance\/runs\/learning-subitems-\d+\/report\.json/u);
  assert.equal(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityCount, 60);
  assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes('ACT-G2-MATH-DATA-CLASSIFICATION-NESTED-GROUPS-CANDIDATE'));
  assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes('ACT-G3-MATH-PLACE-VALUE-EXCHANGE-CANDIDATE'));
  assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes('ACT-G3-MATH-VERTICAL-REGROUPING-CANDIDATE'));
  assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes('ACT-G3-MATH-TWO-STEP-SUPPLY-CANDIDATE'));
  assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes('ACT-G2-MATH-MONEY-COMBINATION-MARKET-CANDIDATE'));
  assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes('ACT-G4-MATH-TWO-STEP-SUPPLY-CANDIDATE'));
  assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes('ACT-G4-MATH-COMPOUND-EXPRESSION-ORDER-CANDIDATE'));
  assert.ok(aggregated.activityPlayabilityInventory.browserVerification.evidenceReportCount >= 3);
  for (const id of [
    'ACT-G1-MATH-MONEY-COUNT-EXCHANGE-CANDIDATE',
    'ACT-G2-MATH-CLOCK-HANDS-CANDIDATE',
    'ACT-G4-MATH-UNIT-CUBE-VOLUME-BUILDER-CANDIDATE',
    'ACT-G6-MATH-BASE-COMPARISON-RATIO-CANDIDATE',
  ]) assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes(id));
  const areaTask = aggregated.activityPlayabilityInventory.catalogCandidateTasks.activities.find(({ activityId }) => activityId === 'ACT-G3-MATH-AREA-GRID-CONSTRUCTION-CANDIDATE');
  assert.equal(areaTask?.browserVerified, true);
  assert.deepEqual(areaTask.browserVerification.viewports, ['1366x768', '390x844', '340x740']);
  for (const id of [
    'ACT-G4-MATH-COMPUTATION-PROPERTY-TRANSFORM-CANDIDATE',
    'ACT-G4-MATH-TEXT-FORMULA-BUILDER-CANDIDATE',
    'ACT-G4-MATH-TWO-DIMENSIONAL-NUMBER-PATTERN-CANDIDATE',
  ]) {
    assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes(id));
    const task = aggregated.activityPlayabilityInventory.catalogCandidateTasks.activities.find(({ activityId }) => activityId === id);
    assert.equal(task.browserVerified, true);
    assert.equal(task.browserVerification.evidenceId, 'grade4-r42-r43-r44-20261024112315');
    assert.deepEqual(task.browserVerification.viewports, ['1366x768', '390x844', '340x740']);
  }
  for (const id of [
    'ACT-G6-SCIENCE-ANIMAL-STRUCTURE-MOVEMENT-EVIDENCE-CANDIDATE',
    'ACT-G6-SCIENCE-PLANT-STRUCTURE-FUNCTION-EVIDENCE-CANDIDATE',
    'ACT-G6-SOCIAL-GLOBAL-ISSUE-SCALE-COMPARISON-CANDIDATE',
    'ACT-G6-HPE-MEDICATION-INFORMATION-CONSULT-CANDIDATE',
    'ACT-G4-MATH-INTEGER-FRACTION-DECIMAL-NUMBER-LINE-CANDIDATE',
    'ACT-G4-MATH-ELAPSED-TIME-TRANSIT-CANDIDATE',
    'ACT-G2-MATH-SHARE-AND-PACK-PORT-CANDIDATE',
    'ACT-G3-MATH-DIVISION-GROUPS-MULTIPLICATION-CHECK-CANDIDATE',
  ]) assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes(id));
  for (const id of [
    'ACT-G1-MATH-LENGTH-COMPARE-ROPE-CANDIDATE',
    'ACT-G5-MATH-LINE-SYMMETRY-MIRROR-GRID-CANDIDATE',
    'ACT-G5-MATH-LINE-CHART-PLOT-CANDIDATE',
    'ACT-G3-MATH-ANGLE-EXPLORER-CANDIDATE',
  ]) assert.ok(aggregated.activityPlayabilityInventory.browserVerification.verifiedActivityIds.includes(id));
});

test('coverage distribution deduplicates task and project subitem identifiers and keeps national totals unknown', () => {
  const summary = inventory.curriculumCoverageDistribution;
  assert.equal(summary.completeness, '清冊未完成');
  assert.equal(summary.distinctCatalogCandidateTaskCount, new Set(Object.values(summary.taskCountsByGrade).flatMap(({ activityIds }) => activityIds)).size);
  assert.equal(summary.registeredProjectSubitemCount, 140);
  assert.equal(summary.projectSubitemsWithClaimedInteractiveStagesCount, 108);
  assert.equal(summary.associatedFocusWithoutExplicitSubitemClaimCount, 12);
  assert.equal(summary.verifiedRegisteredFocusWithoutActivityAssociationCount, 26);
  assert.equal(summary.officialElementaryItemTotal, null);
  assert.equal(summary.unregisteredOfficialItemTotal, null);
  assert.equal(summary.nationalCoverageRate, null);
  assert.deepEqual(summary.taskCountsByGrade['grade-3'].activityIds.filter((id) => id === 'ACT-G3-SOCIAL-CHANGE-CAUSE-EVIDENCE-CANDIDATE'), ['ACT-G3-SOCIAL-CHANGE-CAUSE-EVIDENCE-CANDIDATE']);
});
