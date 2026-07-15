// Auth module placeholder
export const login = async (email, password) => {
  console.log("Auth: login simulated for", email);
  return { email, uid: "mock-uid" };
};

export const logout = async () => {
  console.log("Auth: logout simulated");
};
