import Link from "next/link";
import { FC } from "react";
import logo from "@/assets/images/logo.webp";
import AppPicture from "@/components/app-picture";

const Logo: FC = () => {
  return (
    <Link href="/" className="block max-w-8.5">
      <AppPicture src={logo} alt={"logo"} className="w-full" />
    </Link>
  );
};

export default Logo;
