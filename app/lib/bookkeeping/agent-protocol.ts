import type {
  AgentHandoffEnvelope,
  ConsolidatedTransactionLog,
  CpaDocumentationPack,
  ProfitAndLossReport,
  SpecialistAgentKind,
} from "./types";

export function createHandoff<TPayload>(
  from: SpecialistAgentKind,
  to: SpecialistAgentKind,
  purpose: string,
  payload: TPayload,
): AgentHandoffEnvelope<TPayload> {
  return {
    from,
    to,
    purpose,
    createdAt: new Date().toISOString(),
    payload,
  };
}

export function handoffToProfitAndLoss(
  log: ConsolidatedTransactionLog,
): AgentHandoffEnvelope<ConsolidatedTransactionLog> {
  return createHandoff(
    "bookkeeper",
    "profit_and_loss",
    "Build period P&L from consolidated categorized transactions",
    log,
  );
}

export function handoffToTaxPrep(
  pack: CpaDocumentationPack,
  profitAndLoss: ProfitAndLossReport,
): AgentHandoffEnvelope<{
  cpaPack: CpaDocumentationPack;
  profitAndLoss: ProfitAndLossReport;
}> {
  return createHandoff("bookkeeper", "tax_prep", "CPA review package for monthly close", {
    cpaPack: pack,
    profitAndLoss,
  });
}

export function handoffToReconciliation(
  log: ConsolidatedTransactionLog,
): AgentHandoffEnvelope<ConsolidatedTransactionLog> {
  return createHandoff(
    "bookkeeper",
    "reconciliation",
    "Reconcile categorized ledger against bank/credit balances",
    log,
  );
}

/**
 * Contract for specialist agents that plug into the bookkeeper workflow.
 * Implementations can live in-process (this repo) or as separate Cursor agents.
 */
export interface AccountingSpecialistAgent<TInput, TOutput> {
  kind: SpecialistAgentKind;
  acceptsFrom: SpecialistAgentKind[];
  run: (input: TInput) => TOutput | Promise<TOutput>;
}
