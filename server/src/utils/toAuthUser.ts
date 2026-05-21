type AuthUserSource = {
  _id: unknown;
  name: string;
  email: string;
  hasCompletedOnboarding?: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  hasCompletedOnboarding: boolean;
};

export function toAuthUser(user: AuthUserSource): AuthUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    hasCompletedOnboarding: Boolean(user.hasCompletedOnboarding),
  };
}
