export function amountOfPower(price: number, cost: number): number {
  if (cost == 0) {
    return 0;
  }
  return (cost ?? 0) / price;
}

export function amountOfCost(price: number, power: number): number {
  return price * power;
}
