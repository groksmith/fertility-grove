/** Panels: white, one large radius, separated from the ground by tone alone. */
export function Panel({
  children,
  className = "",
  as: As = "section",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={`rounded-[20px] border border-line bg-panel ${className}`} {...rest}>
      {children}
    </As>
  );
}
