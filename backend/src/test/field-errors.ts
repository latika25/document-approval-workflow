import type * as v from "valibot";
import { AppError } from "../errors.js";
import { parseInput } from "../validation.js";

export function fieldErrors(schema: v.GenericSchema, input: unknown) {
  try {
    parseInput(schema, input);
  } catch (error) {
    if (error instanceof AppError) return error.details ?? [];
  }
  throw new Error("Expected validation to fail");
}
