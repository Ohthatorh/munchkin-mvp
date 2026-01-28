import { FC } from "react";
import Logo from "./logo";
import Links from "./links";
import Actions from "./actions";

interface IHeader {}

const Header: FC<IHeader> = () => {
  return (
    <header className="py-1.5">
      <div className="container">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <Logo />
          <Links />
          <Actions />
        </div>
      </div>
    </header>
  );
};

export default Header;
