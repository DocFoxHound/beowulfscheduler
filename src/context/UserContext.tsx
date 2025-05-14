import { createContext, useContext, useState } from "react";

export const UserContext = createContext<any>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [dbUser, setDbUser] = useState<any>(null);
  const [userRank, setUserRank] = useState<any>(null);

  return (
    <UserContext.Provider value={{ dbUser, setDbUser, userRank, setUserRank }}>
      {children}
    </UserContext.Provider>
  );
}

// Optional: custom hook for easier usage
export function useUserContext() {
  return useContext(UserContext);
}