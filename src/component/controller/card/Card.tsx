import { LucideIcon } from "lucide-react";
import { FC } from "react";

interface CardProps {
    iconHeader: LucideIcon;
    headerName: string;
    iconValue: LucideIcon;
    valueData: string | number;
}

const Card: FC<CardProps> = ({ iconHeader: IconHeader, headerName, iconValue: IconValue, valueData }) => {
    return (
        <div className="rounded shadow p-4 select-none bg-[#18181B]">
          <h1 className="text-xs flex flex-row gap-1 mb-2">
            <IconHeader className="w-3 h-3" />
            {headerName}
          </h1>
          <div className="flex flex-row gap-4 mb-2 text-3xl font-bold">
            <IconValue className="w-8 h-8" />
            {valueData}
          </div>
        </div>
    );
};

export default Card;