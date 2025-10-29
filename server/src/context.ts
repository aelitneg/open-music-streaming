export type AppContext = {
  destroy: () => Promise<void>;
};

export async function createAppContext(): Promise<AppContext> {
  return {
    destroy: async () => {
      return;
    },
  };
}
