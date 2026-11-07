import { NextFunction, Request, Response } from "express";

// Runs when no route matches the request
export function notFound(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

// Runs when any error is passed to next(err) or thrown in a route
export function errorHandler(
  err: Error & { type?: string },
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.log(err);

  // Invalid JSON in the request body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  // Invalid MongoDB ID, for example /api/admin/users/abc
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
}
