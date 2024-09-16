import React, { useState, useEffect } from 'react';
import './Modal.css';

const Modal = ({ id, children, isOpen, onClose }) => {
    const [visible, setVisible] = useState(isOpen);

    useEffect(() => {
        setVisible(isOpen);
    }, [isOpen]);

    const handleClose = () => {
        setVisible(false);
        if (onClose) onClose();
    };

    if (!visible) return null;

    return (
        <>
            <div className="jw-modal">
                <div className="jw-modal-body">
                    {children}
                    <button className="close-button" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
            <div className="jw-modal-background" onClick={handleClose}></div>
        </>
    );
};

export default Modal;
