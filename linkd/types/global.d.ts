interface Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: any) => void;
        prompt: (callback: (notification: any) => void) => void;
        cancel: () => void;
      },
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: { access_token?: string }) => void;
        }) => { requestAccessToken: () => void }
      }
    }
  }
}
