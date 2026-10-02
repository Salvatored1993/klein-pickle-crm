"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { profileName, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LeadDocument = Database["public"]["Tables"]["lead_documents"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const BUCKET = "lead-documents";
const MAX_BYTES = 25 * 1024 * 1024;

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Storage keys can't safely hold every character a file name might have;
// the original name is kept in lead_documents.file_name for display.
function safeKeyName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-120);
}

export function LeadDocuments({
  leadId,
  documents,
  profiles,
}: {
  leadId: string;
  documents: LeadDocument[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function upload(files: FileList) {
    const supabase = createClient();
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 25 MB`);
        continue;
      }
      const path = `${leadId}/${crypto.randomUUID()}-${safeKeyName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) {
        toast.error(`Couldn't upload ${file.name}: ${uploadError.message}`);
        continue;
      }
      const { error: rowError } = await supabase.from("lead_documents").insert({
        lead_id: leadId,
        storage_path: path,
        file_name: file.name,
        content_type: file.type || null,
        size_bytes: file.size,
      });
      if (rowError) {
        await supabase.storage.from(BUCKET).remove([path]);
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

  async function open(doc: LeadDocument) {
    // Open the tab synchronously so pop-up blockers allow it, then point it
    // at a short-lived signed link once we have one.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    const { data, error } = await createClient()
      .storage.from(BUCKET)
      .createSignedUrl(doc.storage_path, 60);
    if (error || !data) {
      tab?.close();
      toast.error("Couldn't open that document");
      return;
    }
    if (tab) tab.location.href = data.signedUrl;
    else window.location.assign(data.signedUrl);
  }

  async function remove(doc: LeadDocument) {
    if (!window.confirm(`Delete "${doc.file_name}"? This can't be undone.`)) return;
    const supabase = createClient();
    setBusyId(doc.id);
    const { error } = await supabase.from("lead_documents").delete().eq("id", doc.id);
    if (!error) await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    setBusyId(null);
    if (error) {
      toast.error(`Couldn't delete: ${error.message}`);
      return;
    }
    toast.success("Document deleted");
    router.refresh();
  }

  return (
    <Card>
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
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents yet. Upload NDAs, spec sheets, signed forms and so on (up to 25 MB each).
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => open(doc)}
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
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${doc.file_name}`}
                  disabled={busyId === doc.id}
                  onClick={() => remove(doc)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
