import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/client";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { TextAreaField, TextField } from "../../components/ui/Field";
import { ACCEPT_ATTRIBUTE, MAX_UPLOAD_MB, validateFile } from "../../lib/upload-rules";
import { useCreateSubmission } from "./queries";

type Errors = Partial<Record<"title" | "content" | "file", string>>;

export function NewSubmissionForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0); // changing the key resets the file input
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedTitle, setSubmittedTitle] = useState<string | null>(null);
  const createSubmission = useCreateSubmission();

  function validate(): Errors {
    const next: Errors = {};
    if (!title.trim()) next.title = "Title is required.";
    else if (title.trim().length > 200) next.title = "Title must be at most 200 characters.";
    if (!content.trim() && !file) next.content = "Add some document text or attach a file.";
    const fileError = file && validateFile(file);
    if (fileError) next.file = fileError;
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmittedTitle(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const { submission } = await createSubmission.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        file,
      });
      setTitle("");
      setContent("");
      setFile(null);
      setFileInputKey((key) => key + 1);
      setSubmittedTitle(submission.title);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors());
        if (error.code === "PAYLOAD_TOO_LARGE" || error.code === "UNSUPPORTED_FILE_TYPE") {
          setErrors({ file: error.message });
        } else if (error.details.length === 0) {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Card>
      <CardHeader title="New submission" description="Send a document to the reviewers." />
      <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-5">
        {submittedTitle && (
          <Alert variant="success">“{submittedTitle}” was submitted for review.</Alert>
        )}
        {formError && <Alert>{formError}</Alert>}

        <TextField
          label="Title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          maxLength={200}
          placeholder="e.g. Q3 marketing budget"
        />

        <TextAreaField
          label="Document text"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          error={errors.content}
          hint="Optional if you attach a file."
          rows={5}
          placeholder="Paste or write the document here…"
        />

        <div>
          <label htmlFor="file" className="mb-1.5 block text-sm font-medium text-slate-700">
            Attachment
          </label>
          <input
            key={fileInputKey}
            id="file"
            name="file"
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            aria-invalid={errors.file ? true : undefined}
            aria-describedby="file-message"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p
            id="file-message"
            className={
              errors.file ? "mt-1.5 text-sm text-rose-600" : "mt-1.5 text-xs text-slate-500"
            }
          >
            {errors.file ?? `PDF, DOCX, TXT, PNG or JPG, up to ${MAX_UPLOAD_MB} MB.`}
          </p>
        </div>

        <Button type="submit" loading={createSubmission.isPending} className="w-full">
          {createSubmission.isPending ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </Card>
  );
}
