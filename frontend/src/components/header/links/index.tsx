import Link from "next/link";
import { FC } from "react";

interface ILinks {}

const Links: FC<ILinks> = () => {
  return (
    <nav>
      <ul className="flex gap-8 items-center">
        <li>
          <Link href="#" className="font-medium text-base">
            О сервисе
          </Link>
        </li>
        <li>
          <Link href="#" className="font-medium text-base">
            FAQ
          </Link>
        </li>
        <li>
          <Link href="#" className="font-medium text-base">
            Контакты
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Links;
