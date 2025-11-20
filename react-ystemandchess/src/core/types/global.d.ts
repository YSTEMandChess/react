declare global {
    interface Window {
      AdobeDC: {
        View: {
          new (config: { clientId: string; divId: string }): any;
          previewFile: (config: { content: { location: { url: string } }; metaData: { fileName: string } }, options: { embedMode: string; dockPageControls: boolean }) => void;
        };
      };
    }
  }

  export {}; // To make sure this file is treated as a module
