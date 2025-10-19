import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleValidationError(error: ZodError) {
  const formattedErrors = error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return NextResponse.json(
    {
      error: "Validation failed",
      details: formattedErrors,
    },
    { status: 400 }
  );
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
