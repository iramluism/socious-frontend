/** Response from ``POST /documents`` when the ingest job is accepted. */
export interface DocumentAccepted {
  task_id: string;
  status: string;
}
