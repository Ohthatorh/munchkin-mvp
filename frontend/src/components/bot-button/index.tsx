import Cube from "@/assets/icons/cube";
import { FC } from "react";

interface IBotButton {}

const BotButton: FC<IBotButton> = () => {
  return (
    <button className="flex items-center gap-1.75 bg-brown text-white text-base font-underdog rounded-[10px] px-2.25 py-2">
      <Cube />
      Добавить бота в Telegram
    </button>
  );
};

export default BotButton;
