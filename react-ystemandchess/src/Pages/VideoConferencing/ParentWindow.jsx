import React, { useRef } from 'react';

const ParentWindow = ({ mentorId, studentId }) => {
  // Create a reference for the iframe
  const iframeRef = useRef(null);

  // Send a message to the iframe when the button is clicked
  const sendMessageToIframe = () => {
    if (iframeRef.current) {
      const data = {
        command: "userinfo",
        channel: "system-chess",
        mentor: mentorId,
        student: studentId,
        role: "mentor"
      };
      iframeRef.current.contentWindow.postMessage(JSON.stringify(data), '*');
      console.log("Sent message to iframe:", data);
    }
  };

  sendMessageToIframe();

  return (
    <div>
      <iframe
        ref={iframeRef}
        src="index.html"
        style={{ width: '100%', height: '300px', border: '1px solid #ccc' }}
        title="Iframe"
      />
    </div>
  );
};

export default ParentWindow;
