import ngrok from "ngrok";

async function startNgrok(port: number): Promise<string> {
  try {
    const url = await ngrok.connect({ addr: port });
    console.log(`Ngrok tunnel started at: ${url}`);
    return url;
  } catch (error) {
    console.error("Error starting Ngrok:", error);
    throw error;
  }
}

export { startNgrok };
