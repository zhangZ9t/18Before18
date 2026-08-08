export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    householdId: user.householdId?.toString() ?? null,
  }
}
