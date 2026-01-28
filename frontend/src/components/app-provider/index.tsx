import Header from "../header";
import { FC } from "react";

interface IAppProvider {
  children: React.ReactNode;
}

const AppProvider: FC<IAppProvider> = ({ children }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default AppProvider;
