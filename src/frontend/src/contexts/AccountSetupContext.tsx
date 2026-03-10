import { createContext, useContext, useState } from "react";

interface AccountSetupContextValue {
  isOpen: boolean;
  openAccountSetup: () => void;
  closeAccountSetup: () => void;
}

const AccountSetupContext = createContext<AccountSetupContextValue>({
  isOpen: false,
  openAccountSetup: () => {},
  closeAccountSetup: () => {},
});

export function AccountSetupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openAccountSetup = () => setIsOpen(true);
  const closeAccountSetup = () => setIsOpen(false);

  return (
    <AccountSetupContext.Provider
      value={{ isOpen, openAccountSetup, closeAccountSetup }}
    >
      {children}
    </AccountSetupContext.Provider>
  );
}

export function useAccountSetup() {
  return useContext(AccountSetupContext);
}
