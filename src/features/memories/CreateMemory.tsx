import { useEffect, useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Button from "@cloudscape-design/components/button";
import { collections } from "./data";
import { useDemo } from "../../app/DemoContext";

/** Captures required title/content and creates a session-only memory. */
export function CreateMemory({
  open,
  onClose,
  initialContent = "",
}: {
  open: boolean;
  onClose: () => void;
  initialContent?: string;
}) {
  const { addMemory } = useDemo();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(initialContent);
  const [collection, setCollection] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setContent(initialContent);
    setCollection("");
    setError("");
  }, [open, initialContent]);

  const dismiss = () => {
    setTitle("");
    setContent("");
    setCollection("");
    setError("");
    onClose();
  };

  return (
    <Modal
      visible={open}
      onDismiss={dismiss}
      header="Nuevo recuerdo"
      closeAriaLabel="Cerrar nuevo recuerdo"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || !content.trim()) {
            setError(
              "Escribe un título y un contenido para guardar el recuerdo.",
            );
            return;
          }
          addMemory({ title, content, collection });
          setTitle("");
          setContent("");
          setCollection("");
          setError("");
          onClose();
        }}
        noValidate
      >
        <div className="form-stack">
          <label>
            Título <span className="required">*</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-required="true"
            />
          </label>
          <label>
            Contenido <span className="required">*</span>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              aria-required="true"
            />
          </label>
          <label>
            Colección
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            >
              <option value="">Sin colección</option>
              {collections.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <p className="muted">
            Solo se guarda en esta sesión. Al recargar se restablece la demo.
          </p>
          <div className="actions">
            <Button formAction="none" onClick={dismiss}>
              Cancelar
            </Button>
            <Button variant="primary" formAction="submit">
              Guardar recuerdo
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
