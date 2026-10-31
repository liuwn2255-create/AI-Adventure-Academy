import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEACHER_REVIEW_ACTIVITY_IDS } from '../prototype/data/teacherReviewCatalog.js';
import { ACCEPTANCE_EVIDENCE_SCHEMA_VERSION, validateAcceptanceEvidenceReport } from '../prototype/acceptanceEvidence.js';
export { ACCEPTANCE_EVIDENCE_SCHEMA_VERSION, mergeAcceptanceEvidenceReports, validateAcceptanceEvidenceReport } from '../prototype/acceptanceEvidence.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ACCEPTANCE_EVIDENCE_OUTPUT = path.join(projectRoot, 'prototype/data/acceptance-evidence.json');

export function parseNodeTestSummary(output) {
  const tests = output.match(/ℹ tests (\d+)/);
  const passed = output.match(/ℹ pass (\d+)/);
  const failed = output.match(/ℹ fail (\d+)/);
  if (!tests || !passed || !failed) return null;
  return { tests: Number(tests[1]), passed: Number(passed[1]), failed: Number(failed[1]) };
}

export function createEvidenceRecord({ command, kind, startedAt, finishedAt, durationMs, exitCode, output, summary, coverage, source }) {
  const outputText = String(output ?? '');
  const parsedTest = kind === 'automated_test' ? parseNodeTestSummary(outputText) : null;
  const mapSummaryPattern = command.includes('learning-map.mjs')
    ? /PASS learning map: \d+ grades, \d+ semester slots, \d+ subjects per term, \d+ grade 3 scope entries\./
    : /Learning activity mapping is valid; full-unit prototype responses remain non-formal evidence, not mastery decisions\./;
  const parseable = kind === 'automated_test' ? parsedTest !== null : mapSummaryPattern.test(outputText);
  const testSummaryComplete = parsedTest && parsedTest.failed === 0 && parsedTest.passed === parsedTest.tests && parsedTest.tests > 0;
  const status = exitCode === null ? 'not_run' : exitCode === 0 && parseable && (kind !== 'automated_test' || testSummaryComplete) ? 'passed' : 'failed';
  return {
    evidenceId: `AUTO-${randomUUID()}`,
    evidenceType: kind,
    command,
    status,
    exitCode,
    startedAt,
    finishedAt,
    durationMs,
    summary: summary ?? (parsedTest
      ? `Node 測試 ${parsedTest.tests} 項：${parsedTest.passed} PASS、${parsedTest.failed} FAIL。`
      : status === 'passed' ? outputText.trim().slice(0, 1200) : '未取得可解析的成功結果。'),
    parsedTest,
    coverage: [...coverage],
    source,
    limitations: kind === 'mapping_validation'
      ? '只檢查專案映射資料規則；不代表官方課綱原文已核對、教師已審查或教學有效。'
      : '工程測試結果不代表課綱符合、教師審查完成、學生精熟或正式核准。',
  };
}

export function preserveBrowserAcceptanceEvidence(nextReport, existingReport) {
  const nextValidation = validateAcceptanceEvidenceReport(nextReport);
  const existingValidation = validateAcceptanceEvidenceReport(existingReport);
  if (!nextValidation.ok) throw new TypeError(`新工程報告無效：${nextValidation.errors.join(' ')}`);
  if (!existingValidation.ok) throw new TypeError(`既有工程報告無效，拒絕覆寫：${existingValidation.errors.join(' ')}`);
  const preservedRecords = existingValidation.value.records.filter((record) => ['browser_acceptance', 'question_data_audit'].includes(record.evidenceType));
  const merged = { ...nextValidation.value, records: [...nextValidation.value.records, ...preservedRecords] };
  const mergedValidation = validateAcceptanceEvidenceReport(merged);
  if (!mergedValidation.ok) throw new TypeError(`合併瀏覽器證據失敗：${mergedValidation.errors.join(' ')}`);
  return mergedValidation.value;
}

function runCommand(command, args, kind, coverage, source) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const start = performance.now();
    const child = spawn(process.execPath, args, { cwd: projectRoot, windowsHide: true });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', (error) => {
      output += `\n${error.message}`;
      const finishedAt = new Date().toISOString();
      resolve(createEvidenceRecord({ command, kind, startedAt, finishedAt, durationMs: performance.now() - start, exitCode: null, output, coverage, source }));
    });
    child.on('close', (exitCode) => {
      const finishedAt = new Date().toISOString();
      resolve(createEvidenceRecord({ command, kind, startedAt, finishedAt, durationMs: Math.round(performance.now() - start), exitCode, output, coverage, source }));
    });
  });
}

export async function generateAcceptanceEvidence({ outputPath = ACCEPTANCE_EVIDENCE_OUTPUT } = {}) {
  const commands = [
    { command: 'node --test test/*.test.mjs', args: ['--test', 'test/*.test.mjs'], kind: 'automated_test', source: 'scripts/acceptance-evidence.mjs；Node TAP 測試摘要' },
    { command: 'node scripts/learning-map.mjs', args: ['scripts/learning-map.mjs'], kind: 'mapping_validation', source: 'scripts/learning-map.mjs' },
    { command: 'node scripts/learning-activity-map.mjs', args: ['scripts/learning-activity-map.mjs'], kind: 'mapping_validation', source: 'scripts/learning-activity-map.mjs' },
  ];
  const records = [];
  for (const item of commands) records.push(await runCommand(item.command, item.args, item.kind, TEACHER_REVIEW_ACTIVITY_IDS, item.source));
  let report = {
    schemaVersion: ACCEPTANCE_EVIDENCE_SCHEMA_VERSION,
    reportId: `ACCEPTANCE-${randomUUID()}`,
    generatedAt: new Date().toISOString(),
    coveredActivities: [...TEACHER_REVIEW_ACTIVITY_IDS],
    records,
    limitations: ['僅記錄本機工程命令結果。', '不包含官方課綱原文核對、教師審查或學生試教證據。', '瀏覽器驗收需另行執行並提供其實際記錄。'],
  };
  try {
    const existing = JSON.parse(await readFile(outputPath, 'utf8'));
    report = preserveBrowserAcceptanceEvidence(report, existing);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const validation = validateAcceptanceEvidenceReport(report);
  if (!validation.ok) throw new Error(validation.errors.join(' '));
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = await generateAcceptanceEvidence();
    for (const record of report.records) console.log(`${record.status.toUpperCase()} ${record.command} | exit=${record.exitCode ?? 'not_run'} | ${record.summary} | ${record.durationMs}ms`);
    console.log(`Evidence report: ${ACCEPTANCE_EVIDENCE_OUTPUT}`);
    if (report.records.some((record) => record.status !== 'passed')) process.exitCode = 1;
  } catch (error) {
    console.error(`Could not generate a valid acceptance report: ${error.message}`);
    process.exitCode = 1;
  }
}
