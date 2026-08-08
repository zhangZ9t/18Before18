function serializeCategory(category) {
  return {
    name: category.name,
    weeklyBudget: category.weeklyBudget,
    visibleToTeen: category.visibleToTeen,
  }
}

export function serializeHouseholdForParent(household) {
  return {
    id: household.id,
    name: household.name,
    inviteCode: household.inviteCode,
    weeklyDeposit: household.weeklyDeposit,
    depositFrequency: household.depositFrequency,
    savingsCommitment: household.savingsCommitment,
    independenceLevel: household.independenceLevel,
    householdCategories: household.householdCategories.map(serializeCategory),
    independenceRequest: household.independenceRequest ?? null,
  }
}

export function serializeHouseholdForTeen(household) {
  return {
    id: household.id,
    name: household.name,
    weeklyDeposit: household.weeklyDeposit,
    depositFrequency: household.depositFrequency,
    savingsCommitment: household.savingsCommitment,
    independenceLevel: household.independenceLevel,
    visibleCategories: household.householdCategories
      .filter((category) => category.visibleToTeen)
      .map(({ name, weeklyBudget }) => ({ name, weeklyBudget })),
    independenceRequest:
      household.independenceRequest?.status === 'pending'
        ? {
            requestedLevel: household.independenceRequest.requestedLevel,
            status: household.independenceRequest.status,
          }
        : null,
  }
}
