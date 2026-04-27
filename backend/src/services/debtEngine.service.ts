interface UserBalance {
  userId: string;
  name: string;
  balance: number;
}

interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export const calculateSettlements = (
  users: { id: string; name: string }[],
  expenses: { amount: number; payerId: string; category?: string; receiverId?: string; description?: string }[]
): Settlement[] => {
  if (users.length === 0) return [];

  const normalExpenses = expenses.filter(e => e.category !== 'SETTLEMENT');
  const settlementExpenses = expenses.filter(e => e.category === 'SETTLEMENT');

  // 1. Calculate normal shared expenses (Only consider expenses paid by active members)
  const activeUserIds = new Set(users.map(u => u.id));
  const validNormalExpenses = normalExpenses.filter(e => activeUserIds.has(e.payerId));

  const paidNormalByUserId: Record<string, number> = {};
  users.forEach((u) => (paidNormalByUserId[u.id] = 0));
  validNormalExpenses.forEach((e) => {
    paidNormalByUserId[e.payerId] = (paidNormalByUserId[e.payerId] || 0) + e.amount;
  });

  const totalNormalExpense = validNormalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const averageNormalExpense = users.length > 0 ? totalNormalExpense / users.length : 0;

  // 2. Calculate net balances from normal expenses
  const balances: UserBalance[] = users.map((u) => ({
    userId: u.id,
    name: u.name,
    balance: Math.round((paidNormalByUserId[u.id] - averageNormalExpense) * 100) / 100,
  }));

  // 3. Apply settlements as direct balance transfers (1-to-1)
  settlementExpenses.forEach((s) => {
    const payerBal = balances.find(b => b.userId === s.payerId);
    const receiverBal = balances.find(b => b.userId === s.receiverId);
    
    if (payerBal && receiverBal) {
      payerBal.balance = Math.round((payerBal.balance + s.amount) * 100) / 100;
      receiverBal.balance = Math.round((receiverBal.balance - s.amount) * 100) / 100;
    }
  });

  // 4. Split into Debtors and Creditors
  let debtors = balances
    .filter((b) => b.balance < -0.001) // Lower threshold to capture $0.01 debts
    .sort((a, b) => a.balance - b.balance); // Most negative first

  let creditors = balances
    .filter((b) => b.balance > 0.001)
    .sort((a, b) => b.balance - a.balance); // Most positive first

  const settlements: Settlement[] = [];

  // 5. Greedy resolution (Individual 1-to-1 transfers)
  let dIdx = 0;
  let cIdx = 0;

  // This algorithm ensures that each debt is handled individually.
  // It will never 'merge' debts from different people into a single transfer 
  // unless those people were already aggregated in the balance phase (which we don't do).
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    // Calculate the exact amount to transfer from this specific debtor to this specific creditor
    const amountToPay = Math.round(Math.min(Math.abs(debtor.balance), creditor.balance) * 100) / 100;

    if (amountToPay > 0) {
      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: amountToPay,
      });
    }

    // Update balances for the next iteration of the greedy loop
    debtor.balance = Math.round((debtor.balance + amountToPay) * 100) / 100;
    creditor.balance = Math.round((creditor.balance - amountToPay) * 100) / 100;

    // Move to next debtor/creditor if their balance is settled
    if (Math.abs(debtor.balance) < 0.001) dIdx++;
    if (Math.abs(creditor.balance) < 0.001) cIdx++;
  }

  return settlements;
};
