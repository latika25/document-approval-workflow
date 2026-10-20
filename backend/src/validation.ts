import * as v from "valibot";
import { errors } from "./errors.js";

export function parseInput<TSchema extends v.GenericSchema>(
  schema: TSchema,
  input: unknown,
): v.InferOutput<TSchema> {
  const result = v.safeParse(schema, input, { abortPipeEarly: true });
  if (result.success) {
    return result.output;
  }

  const details = result.issues.map((issue) => {
    const field = v.getDotPath(issue);
    // For a missing field Valibot reports the parent object's message, so replace it.
    const isMissingField = field !== null && issue.input === undefined;
    return {
      field: field ?? "body",
      message: isMissingField ? `${capitalize(field)} is required.` : issue.message,
    };
  });
  throw errors.validation("Some fields are invalid.", details);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const idParamSchema = v.pipe(v.string(), v.uuid("Invalid id."));
