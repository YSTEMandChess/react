import React from "react";
import { cn } from "../../lib/utils";
import { IconClipboard } from "@tabler/icons-react";

export const ButtonsCard = ({
  children,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => {
  return (
      <div className="relative z-40">{children}</div>
  );
};
