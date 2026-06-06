import type { ReactNode } from "react";

function Card({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <article className="painel">
      <h3>{titulo}</h3>
      {children}
    </article>
  );
}

export default Card;