import Icon from "@cloudscape-design/components/icon";
import { Link } from "react-router-dom";
import type { Memory } from "./types";
import { formatDate } from "../../shared/PageHeading";
/** Links a memory summary to its full detail, preserving source metadata. */
export function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <article className="memory-card">
      <span className="memory-icon">
        <Icon name="file" />
      </span>
      <div className="memory-copy">
        <h3>
          <Link to={`/recuerdos/${memory.id}`}>{memory.title}</Link>
        </h3>
        <p>{memory.content}</p>
        <div className="metadata">
          <span>
            <Icon name="folder" /> {memory.collection || "Sin colección"}
          </span>
          <span>{memory.source}</span>
          <span>{formatDate(memory.createdAt)}</span>
        </div>
      </div>
      <Link
        className="detail-arrow"
        aria-label={`Abrir ${memory.title}`}
        to={`/recuerdos/${memory.id}`}
      >
        <Icon name="angle-right" />
      </Link>
    </article>
  );
}
