import * as v from "valibot";

export const loginSchema = v.object(
  {
    username: v.pipe(
      v.string("Username is required."),
      v.trim(),
      v.toLowerCase(),
      v.nonEmpty("Username is required."),
    ),
    password: v.pipe(v.string("Password is required."), v.nonEmpty("Password is required.")),
  },
  "Request body must be a JSON object.",
);

export type LoginInput = v.InferOutput<typeof loginSchema>;
