export interface TTSResponse {
  audioFileId?: string;
  error?: string;
}

export interface TTSQueueItem {
  text: string;
  username?: string;
  resolve: (value: TTSResponse | PromiseLike<TTSResponse>) => void;
  reject: (reason?: Error | unknown) => void;
}