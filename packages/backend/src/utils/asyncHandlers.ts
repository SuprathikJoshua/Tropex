import type { Request, Response, NextFunction } from "express";

type RequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
) => Promise<void | Response>;

const asyncHandler = (requestHandler: RequestHandler) => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(requestHandler(req, res, next)).catch(next);
	};
};

export default asyncHandler;
