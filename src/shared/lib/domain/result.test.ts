import { describe, expect, it } from "vitest";
import {
  calculateAccumulatedResult,
  calculateNetCapital,
  calculateOperationalEquity,
  calculatePlatformResult,
  calculateROI,
  calculateRealizedCashback,
  calculateReceivedBonusesBreakdown,
} from "./result";

describe("result calculations", () => {
  it("calculates net capital from PRD example", () => {
    expect(calculateNetCapital(10_000, 2_000)).toBe(8_000);
  });

  it("calculates accumulated result from PRD example", () => {
    expect(calculateAccumulatedResult(9_500, 8_000)).toBe(1_500);
  });

  it("calculates ROI from PRD example", () => {
    expect(calculateROI(1_500, 8_000)).toBe(18.75);
  });

  it("returns null ROI when net capital is zero", () => {
    expect(calculateROI(100, 0)).toBeNull();
  });

  it("sums operational equity across currencies", () => {
    const equity = calculateOperationalEquity([
      { calculated_balance: 1000, currency: { last_rate_brl: 1 } },
      { calculated_balance: 100, currency: { last_rate_brl: 5.5 } },
    ]);
    expect(equity).toBe(1550);
  });

  it("only counts received cashback", () => {
    const cashback = calculateRealizedCashback([
      {
        type: "cashback",
        amount_brl: 50,
        direction: "credit",
        status: "completed",
      },
      {
        type: "cashback",
        amount_brl: 30,
        direction: "credit",
        status: "pending",
      },
    ]);
    expect(cashback).toBe(50);
  });

  it("sums received bonuses across cashback, rakeback and bonus", () => {
    const breakdown = calculateReceivedBonusesBreakdown([
      {
        type: "cashback",
        amount_brl: 50,
        direction: "credit",
        status: "completed",
      },
      {
        type: "rakeback",
        amount_brl: 20,
        direction: "credit",
        status: "completed",
      },
      {
        type: "bonus",
        amount_brl: 30,
        direction: "credit",
        status: "completed",
      },
      {
        type: "bonus",
        amount_brl: 10,
        direction: "credit",
        status: "pending",
      },
    ]);

    expect(breakdown).toEqual({
      cashback: 50,
      rakeback: 20,
      bonus: 30,
      total: 100,
    });
  });

  it("counts bonus metadata as received when movement status is pending", () => {
    const breakdown = calculateReceivedBonusesBreakdown([
      {
        type: "rakeback",
        amount_brl: 15,
        direction: "credit",
        status: "pending",
        metadata: { rakeback_status: "recebido" },
      },
    ]);

    expect(breakdown.rakeback).toBe(15);
    expect(breakdown.total).toBe(15);
  });

  it("calculates platform result", () => {
    const result = calculatePlatformResult({
      initialBalanceBrl: 1000,
      finalBalanceBrl: 1500,
      depositsBrl: 200,
      withdrawalsBrl: 100,
      cashbackBrl: 50,
      bonusesBrl: 0,
      feesBrl: 25,
    });
    expect(result).toBe(425);
  });
});