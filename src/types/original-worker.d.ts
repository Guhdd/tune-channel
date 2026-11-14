declare module "@/legacy/original-worker.mjs" {
  const worker: {
    fetch(request: Request): Promise<Response>;
  };

  export default worker;
}
