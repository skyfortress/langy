export interface TTSResponse {
  audioPath?: string;
  error?: string;
}

export interface TTSQueueItem {
  text: string;
  resolve: (value: TTSResponse | PromiseLike<TTSResponse>) => void;
  reject: (reason?: Error | unknown) => void;
}