import { describe, it, expect } from 'vitest';
import { ReportBuilder } from '../../../src/reports/report-builder.js';
import { createMockRawData } from '../../fixtures/mock-data.js';

describe('ReportBuilder', () => {
  it('should produce a complete FullReport from mock data', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report).toBeDefined();
  });

  it('should have correct meta information', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.meta.companyId).toBe(12345);
    expect(report.meta.companyName).toBe('テスト株式会社');
    expect(report.meta.reportMonth).toBe('2026-02');
    expect(report.meta.version).toBeTruthy();
    expect(report.meta.generatedAt).toBeTruthy();
  });

  it('should contain executiveSummary with all required fields', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.executiveSummary.monthlyRevenue).toBe(8_500_000);
    expect(report.executiveSummary.monthlyProfit).toBe(report.monthlyPL.ordinaryIncome);
    expect(report.executiveSummary.cashBalance).toBeGreaterThan(0);
    expect(report.executiveSummary.revenueChangeRate).not.toBeNull();
    expect(report.executiveSummary.profitChangeRate).not.toBeNull();
    expect(report.executiveSummary.overallAssessment).toBeTruthy();
    expect(report.executiveSummary.keyMessage).toBeTruthy();
  });

  it('should contain monthlyPL with correct values', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.monthlyPL.revenue).toBe(8_500_000);
    expect(report.monthlyPL.costOfSales).toBe(2_800_000);
    expect(report.monthlyPL.grossProfit).toBe(5_700_000);
    expect(report.monthlyPL.sgaExpenses).toBe(4_310_000);
    expect(report.monthlyPL.operatingIncome).toBe(1_390_000);
    expect(report.monthlyPL.expenseBreakdown.length).toBeGreaterThan(0);
  });

  it('should contain balanceSheet with correct values', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.balanceSheet.currentAssets).toBe(18_950_000);
    expect(report.balanceSheet.fixedAssets).toBe(6_800_000);
    expect(report.balanceSheet.netAssets).toBe(10_900_000);
    expect(report.balanceSheet.cashAndDeposits).toBeGreaterThan(0);
  });

  it('should contain comparison with previous month data', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.comparison.current).toBeDefined();
    expect(report.comparison.previous).not.toBeNull();
    expect(report.comparison.changes).not.toBeNull();
    expect(report.comparison.changes!.revenueChange).toBe(8_500_000 - 7_800_000);
  });

  it('should contain financialMetrics with profitability and safety', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.financialMetrics.profitability).toBeDefined();
    expect(report.financialMetrics.profitability.grossProfitMargin).toBeGreaterThan(0);
    expect(report.financialMetrics.profitability.operatingProfitMargin).toBeGreaterThan(0);
    expect(report.financialMetrics.profitability.ordinaryProfitMargin).toBeGreaterThan(0);

    expect(report.financialMetrics.safety).toBeDefined();
    expect(report.financialMetrics.safety.currentRatio).toBeGreaterThan(0);
    expect(report.financialMetrics.safety.equityRatio).toBeGreaterThan(0);
  });

  it('should contain cashFlowAnalysis', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.cashFlowAnalysis.currentCash).toBeGreaterThan(0);
    expect(report.cashFlowAnalysis.monthlyBurnRate).toBeGreaterThan(0);
    expect(report.cashFlowAnalysis.cashRunwayMonths).toBeGreaterThan(0);
    expect(['safe', 'caution', 'warning', 'danger']).toContain(report.cashFlowAnalysis.shortageRisk);
  });

  it('should contain bankingMetrics', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.bankingMetrics).toBeDefined();
    expect(report.bankingMetrics.equityRatio).toBeGreaterThan(0);
    expect(report.bankingMetrics.operatingProfitMargin).toBeGreaterThan(0);
    expect(['excellent', 'good', 'fair', 'poor', 'critical']).toContain(
      report.bankingMetrics.overallScore,
    );
  });

  it('should contain exactly 5 evaluations', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.evaluations).toHaveLength(5);
    const categories = report.evaluations.map((e) => e.category);
    expect(categories).toContain('profit');
    expect(categories).toContain('cash_flow');
    expect(categories).toContain('fixed_cost');
    expect(categories).toContain('revenue_dependency');
    expect(categories).toContain('banking');
  });

  it('should contain anomalies array', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(Array.isArray(report.anomalies)).toBe(true);
    // With reasonable mock data, there may or may not be anomalies
    for (const anomaly of report.anomalies) {
      expect(anomaly.type).toBeTruthy();
      expect(anomaly.severity).toBeTruthy();
      expect(anomaly.message).toBeTruthy();
    }
  });

  it('should contain commentary with all required fields', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.commentary).toBeDefined();
    expect(report.commentary.executiveSummary).toBeTruthy();
    expect(report.commentary.profitComment).toBeTruthy();
    expect(report.commentary.cashFlowComment).toBeTruthy();
    expect(Array.isArray(report.commentary.positivePoints)).toBe(true);
    expect(Array.isArray(report.commentary.negativePoints)).toBe(true);
    expect(Array.isArray(report.commentary.actionItems)).toBe(true);
    expect(Array.isArray(report.commentary.dataLimitations)).toBe(true);
  });

  it('should calculate executiveSummary expenses as costOfSales + sgaExpenses', async () => {
    const builder = new ReportBuilder();
    const rawData = createMockRawData();

    const report = await builder.build(rawData, 2026, 2);

    expect(report.executiveSummary.monthlyExpenses).toBe(
      report.monthlyPL.costOfSales + report.monthlyPL.sgaExpenses,
    );
  });
});
