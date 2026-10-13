"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { profileName, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Shape shared by lead_documents and customer_documents rows.
export type DocumentRow = {
  id: string;
  storage_path: string;
  file_name: string;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
};

type Target = { leadId: string } | { customerId: string };

const BUCKETS = { lead: "lead-documents", customer: "customer-documents" } as const;
const MAX_BYTES = 25 * 1024 * 1024;

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Storage keys can't safely hold every character a file name might have;
// the original name is kept in the documents table for display.
function safeKeyName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-120);
}

async function openDocument(bucket: string, doc: DocumentRow) {
  // Open the tab synchronously so pop-up blockers allow it, then point it
  // at a short-lived signed link once we have one.
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  const { data, error } = await createClient()
    .storage.from(bucket)
    .createSignedUrl(doc.storage_path, 60);
  if (error || !data) {
    tab?.close();
    toast.error("Couldn't open that document");
    return;
  }
  if (tab) tab.location.href = data.signedUrl;
  else window.location.assign(data.signedUrl);
}

export function DocumentsPanel({
  target,
  documents,
  leadDocuments = [],
  profiles,
}: {
  target: Target;
  documents: DocumentRow[];
  // On a customer: documents from the lead it was converted from, shown
  // read-only so e.g. an NDA signed during the lead stage isn't lost.
  leadDocuments?: DocumentRow[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Counter rather than a boolean: dragenter/dragleave fire for every child
  // element the cursor crosses, which would otherwise flicker the highlight.
  const [dragDepth, setDragDepth] = useState(0);
  const dragging = dragDepth > 0;

  const isLead = "leadId" in target;
  const ownerId = isLead ? target.leadId : target.customerId;
  const bucket = isLead ? BUCKETS.lead : BUCKETS.customer;

  async function insertRow(path: string, file: File) {
    const supabase = createClient();
    const fields = {
      storage_path: path,
      file_name: file.name,
      content_type: file.type || null,
      size_bytes: file.size,
    };
    return isLead
      ? supabase.from("lead_documents").insert({ lead_id: ownerId, ...fields })
      : supabase.from("customer_documents").insert({ customer_id: ownerId, ...fields });
  }

  function hasFiles(e: React.DragEvent) {
    return Array.from(e.dataTransfer.types).includes("Files");
  }

  async function upload(files: FileList) {
    const supabase = createClient();
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 25 MB`);
        continue;
      }
      const path = `${ownerId}/${crypto.randomUUID()}-${safeKeyName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) {
        toast.error(`Couldn't upload ${file.name}: ${uploadError.message}`);
        continue;
      }
      const { error: rowError } = await insertRow(path, file);
      if (rowError) {
        await supabase.storage.from(bucket).remove([path]);
        toast.error(`Couldn't save ${file.name}: ${rowError.message}`);
        continue;
      }
      uploaded++;
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded > 0) {
      toast.success(uploaded === 1 ? "Document uploaded" : `${uploaded} documents uploaded`);
      router.refresh();
    }
  }

  async function remove(doc: DocumentRow) {
    if (!window.confirm(`Delete "${doc.file_name}"? This can't be undone.`)) return;
    const supabase = createClient();
    setBusyId(doc.id);
    const { error } = isLead
      ? await supabase.from("lead_documents").delete().eq("id", doc.id)
      : await supabase.from("customer_documents").delete().eq("id", doc.id);
    if (!error) await supabase.storage.from(bucket).remove([doc.storage_path]);
    setBusyId(null);
    if (error) {
      toast.error(`Couldn't delete: ${error.message}`);
      return;
    }
    toast.success("Document deleted");
    router.refresh();
  }

  const rows = [
    ...documents.map((doc) => ({ doc, bucket, fromLead: false })),
    ...leadDocuments.map((doc) => ({ doc, bucket: BUCKETS.lead, fromLead: true })),
  ];

  return (
    <Card
      className={dragging ? "ring-2 ring-primary ring-offset-2" : undefined}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setDragDepth((d) => d + 1);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        setDragDepth((d) => Math.max(0, d - 1));
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setDragDepth(0);
        if (!uploading && e.dataTransfer.files.length) upload(e.dataTransfer.files);
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Documents</CardTitle>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </CardHeader>
      <CardContent>
        {dragging ? (
          <div className="mb-3 rounded-md border-2 border-dashed border-primary bg-primary/5 p-6 text-center text-sm font-medium">
            Drop files here to upload
          </div>
        ) : null}
        {rows.length === 0 ? (
          dragging ? null : (
            <div className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
              Drag files here, or click Upload. NDAs, signed agreements, spec sheets, forms and so
              on (up to 25 MB each).
            </div>
          )
        ) : (
          <ul className="flex flex-col divide-y">
            {rows.map(({ doc, bucket: docBucket, fromLead }) => (
              <li key={doc.id} className="flex items-center gap-3 py-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => openDocument(docBucket, doc)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-medium hover:underline">
                    {doc.file_name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {[
                      profileName(profiles, doc.uploaded_by),
                      formatDateTime(doc.created_at),
                      formatSize(doc.size_bytes),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
                {fromLead ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    From lead
                  </Badge>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${doc.file_name}`}
                    disabled={busyId === doc.id}
                    onClick={() => remove(doc)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {rows.length > 0 && !dragging ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Tip: you can drag files onto this box to upload them.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
