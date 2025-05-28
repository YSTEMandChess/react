class ViewSDKClient {
  readyPromise: Promise<unknown>;
  constructor() {
    this.readyPromise = new Promise<void>((resolve) => {
      if (window.AdobeDC) {
        resolve();
      } else {
        document.addEventListener("adobe_dc_view_sdk.ready", () => {
          resolve()
        });
      }
    });
  }

  ready() {
    return this.readyPromise;
  }

  previewFile(url: string, elementId: string, options: { embedMode: string; dockPageControls: boolean; }) {
    const adobeDCView = new window.AdobeDC.View({
      clientId: "your_client_id",
      divId: elementId,
    });

    adobeDCView.previewFile(
      {
        content: { location: { url: url } },
        metaData: { fileName: "file.pdf" }
      },
      options
    );
  }
}

export default new ViewSDKClient();