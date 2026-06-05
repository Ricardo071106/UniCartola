declare module "pdf-parse" {
  type PdfResult = { text: string; numpages: number };
  function pdf(
    data: Buffer,
    options?: { max?: number }
  ): Promise<PdfResult>;
  export = pdf;
}
