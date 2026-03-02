// Auto-generated stub - backend not yet compiled
// biome-ignore lint/suspicious/noExplicitAny: generated stub
export type backendInterface = Record<string, any>;
// biome-ignore lint/suspicious/noExplicitAny: generated stub
export type CreateActorOptions = Record<string, any>;

export class ExternalBlob {
  // biome-ignore lint/suspicious/noExplicitAny: generated stub
  static fromURL(_url: string): ExternalBlob { return new ExternalBlob(); }
  async getBytes(): Promise<Uint8Array> { return new Uint8Array(); }
  onProgress?: (progress: number) => void;
}

export async function createActor(
  _canisterId: string,
  // biome-ignore lint/suspicious/noExplicitAny: generated stub
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  // biome-ignore lint/suspicious/noExplicitAny: generated stub
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  // biome-ignore lint/suspicious/noExplicitAny: generated stub
  _options?: Record<string, any>,
): Promise<backendInterface> {
  return {} as backendInterface;
}
