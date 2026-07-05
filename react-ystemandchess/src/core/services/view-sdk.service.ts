/**
 * Adobe View SDK Service
 * 
 * Client service for embedding and displaying PDF documents using Adobe's View SDK.
 * Handles initialization, ready state checking, and PDF preview functionality.
 * 
 * Used for displaying PDF documents (like certificates, reports) in the application.
 */

class ViewSDKClient {
  readyPromise: Promise<unknown>;
  
  /**
   * Initializes the Adobe View SDK client
   * Creates a promise that resolves when the Adobe DC View SDK is ready
   */
  constructor() {
    this.readyPromise = new Promise<void>((resolve) => {
      // Check if Adobe DC is already loaded
      if (window.AdobeDC) {
        resolve();
      } else {
        // Wait for Adobe DC View SDK to be ready
        document.addEventListener("adobe_dc_view_sdk.ready", () => {
          resolve()
        });
      }
    });
  }

  /**
   * Returns a promise that resolves when Adobe SDK is ready
   * @returns Promise that resolves when SDK is initialized
   */
  ready() {
    return this.readyPromise;
  }

  /**
   * Previews a PDF file in a specified HTML element
   * @param url - URL of the PDF file to preview
   * @param elementId - HTML element ID where PDF will be embedded
   * @param options - Display options (embed mode, page controls, etc.)
   */
  previewFile(url: string, elementId: string, options: { embedMode: string; dockPageControls: boolean; }) {
    // Create new Adobe DC View instance
    const adobeDCView = new window.AdobeDC.View({
      clientId: "your_client_id",
      divId: elementId,
    });

    // Load and display the PDF with specified options
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