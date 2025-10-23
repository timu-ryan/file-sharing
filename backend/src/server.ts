import express from "express";
import type { Request, Response } from "express";

const app = express();

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Hello World!");
})

app.get("/download", (req: Request, res: Response) => {
  res.status(200).download('./src/server.ts');
})

app.listen(3001, () => console.log("Server started on port 3001"));
