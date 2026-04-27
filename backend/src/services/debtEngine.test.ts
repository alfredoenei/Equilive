import { calculateSettlements } from './debtEngine.service';

describe('Debt Engine - calculateSettlements', () => {
  const users = [
    { id: '1', name: 'Andres' },
    { id: '2', name: 'Maria' },
    { id: '3', name: 'Juan' },
  ];

  test('Simple case: One person pays everything', () => {
    const expenses = [
      { amount: 90, payerId: '1' }, // Andres paid 90
    ];
    // Total 90, Avg 30. 
    // Andres: 90 - 30 = +60
    // Maria: 0 - 30 = -30
    // Juan: 0 - 30 = -30

    const settlements = calculateSettlements(users, expenses);
    
    expect(settlements).toHaveLength(2);
    expect(settlements).toContainEqual({ from: '2', fromName: 'Maria', to: '1', toName: 'Andres', amount: 30 });
    expect(settlements).toContainEqual({ from: '3', fromName: 'Juan', to: '1', toName: 'Andres', amount: 30 });
  });

  test('Complex case: Multiple payers', () => {
    const expenses = [
      { amount: 100, payerId: '1' }, // Andres paid 100
      { amount: 50, payerId: '2' },  // Maria paid 50
    ];
    // Total 150, Avg 50
    // Andres: 100 - 50 = +50
    // Maria: 50 - 50 = 0
    // Juan: 0 - 50 = -50

    const settlements = calculateSettlements(users, expenses);
    
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({ from: '3', fromName: 'Juan', to: '1', toName: 'Andres', amount: 50 });
  });

  test('Floating point precision handling', () => {
    const expenses = [
      { amount: 100, payerId: '1' }, // Andres paid 100
    ];
    // Total 100, Avg 33.333...
    // Andres: +66.666
    // Maria: -33.333
    // Juan: -33.333

    const settlements = calculateSettlements(users, expenses);
    
    expect(settlements).toHaveLength(2);
    expect(settlements[0].amount).toBeCloseTo(33.33, 1);
  });
});
