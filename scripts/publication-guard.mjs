import {
  validateRegistryBundle,
  validateNewQuestionReference,
  validateNewLevelReferences,
} from './unit-registry-validator.mjs';

function registryErrors(registryBundle) {
  if (!registryBundle || typeof registryBundle !== 'object') {
    return [{ path: 'registryBundle', code: 'registry_required', message: '發布檢查需要完整單元登錄、ID 歷史、來源及課程地圖資料。' }];
  }
  return validateRegistryBundle(registryBundle).map((error) => ({ ...error, path: `registry.${error.path}` }));
}

/**
 * Shared fail-closed preflight for a new question publication.
 * It returns structured errors and never mutates the question or registry.
 * The caller must refuse publication when errors is non-empty.
 */
export function validateQuestionPublication({ question, registryBundle }) {
  return [
    ...registryErrors(registryBundle),
    ...validateNewQuestionReference(question, registryBundle?.registry).map((error) => ({
      ...error,
      path: `question.${error.path}`,
    })),
  ];
}

/**
 * Shared fail-closed preflight for a new level publication.
 * Level references must resolve to published exact question revisions, and
 * each referenced question must point to the currently approved unit revision.
 * The caller must refuse publication when errors is non-empty.
 */
export function validateLevelPublication({ level, questions, registryBundle }) {
  return [
    ...registryErrors(registryBundle),
    ...validateNewLevelReferences(level, questions, registryBundle?.registry).map((error) => ({
      ...error,
      path: `level.${error.path}`,
    })),
  ];
}
