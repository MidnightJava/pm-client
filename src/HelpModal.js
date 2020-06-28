import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'

function HelpModal({_show, closeButton, hide, title, contents} ){

    const [show, setShow] = useState(_show);

    useEffect(() => {
       setShow(_show)
    }, [_show])
    
    return (
        <Modal show={show} onHide={() => hide()}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ul>
                    {contents}
                </ul>
            </Modal.Body>
            <Modal.Footer>
                {closeButton}
            </Modal.Footer>
        </Modal>
      )
}

export default HelpModal;