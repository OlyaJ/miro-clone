import type { PathParams, ROUTES } from "@/shared/model/routes";
import { useParams } from "react-router-dom";

function BoardPage() {
  const params = useParams<PathParams[typeof ROUTES.BOARD]>()
  
  return <div>Board page {params.boardId}</div>;
}

export const Component = BoardPage;
