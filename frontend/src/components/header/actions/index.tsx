import BotButton from "@/components/bot-button";
import { FC } from "react";

interface IActions {}

const Actions: FC<IActions> = () => {
  return (
    <div className="flex ml-auto items-center">
      <BotButton />
    </div>
  );
};

export default Actions;
