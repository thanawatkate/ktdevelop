import { describe, it, expect } from 'vitest';
import th from '../messages/th.json';
import en from '../messages/en.json';

describe('i18n Messages Integrity', () => {
  it('th.json and en.json both contain portfolio keys', () => {
    expect(th.portfolio).toBeDefined();
    expect(en.portfolio).toBeDefined();

    expect(th.portfolio.label).toBeTruthy();
    expect(en.portfolio.label).toBeTruthy();

    expect(th.portfolio.emptyTitle).toBeTruthy();
    expect(en.portfolio.emptyTitle).toBeTruthy();

    expect(th.portfolio.emptyDescription).toBeTruthy();
    expect(en.portfolio.emptyDescription).toBeTruthy();
  });

  it('th.json and en.json have matching top-level keys', () => {
    const thKeys = Object.keys(th).sort();
    const enKeys = Object.keys(en).sort();
    expect(thKeys).toEqual(enKeys);
  });

  it('navigation keys match between th and en', () => {
    const thNavKeys = Object.keys(th.navigation).sort();
    const enNavKeys = Object.keys(en.navigation).sort();
    expect(thNavKeys).toEqual(enNavKeys);
  });
});
