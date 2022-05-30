import * as React from "react";
import { useSharedState } from "../../../states/AppState";

import { useDropzone, FileWithPath } from 'react-dropzone'
import { useCallback, useState, useEffect } from "react";
import { CommunicationService } from "../../../services/CommunicationService";

import { Col, Row, Form, Button, Modal, InputGroup } from 'react-bootstrap';
import { RepositoryResponse } from "../../../model/RepositoryResponse";
import { FileTreeView } from "./Commits.MakeCommitModal.FileTreeView";
import { FeatureColumn } from "./Commits.MakeCommitModal.FeatureColumn";

export interface CommitFeature {
  enabled: boolean,
  name: string,
  revision: number,
  availablerevisions: number[]
}

export const MakeCommit: React.FC = () => {

  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleClose = () => {
    setConfigFile(undefined);
    setCommitMessage('');
    setShow(false);
    setValidated(false);
    setChoosenFiles(null);
    removeAllFiles();
  }
  const handleShow = () => setShow(true);

  let onModalDismiss = () => {
    handleClose();
  }

  const [appState, setAppState] = useSharedState();

  const [tmpAcceptedFiles, setTmpAcceptedFiles] = useState<Map<String, FileWithPath>>(new Map<String, FileWithPath>()); // as Map to prevent duplicates, old files will be overwritten
  const [configFile, setConfigFile] = useState<FileWithPath>(undefined);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [choosenFiles, setChoosenFiles] = useState<Array<FileWithPath>>(new Array<FileWithPath>());

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    var allFiles = new Map(tmpAcceptedFiles)
    acceptedFiles.forEach(f => {
      if (f.name.endsWith(".config")) {
        setConfigFile(f);
      } else {
        allFiles.set(f.path, f);
      }
    })
    setTmpAcceptedFiles(allFiles);
  }, []);

  const { acceptedFiles, getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const [configString, setConfigString] = useState<string>("");

  let handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;

    event.preventDefault();
    event.stopPropagation();

    if (form.checkValidity() && tmpAcceptedFiles.size !== 0 && configString.length !== 0) {
      CommunicationService.getInstance().makeCommit(appState.repository, commitMessage, configString, choosenFiles).
        then((apiData: RepositoryResponse) => {
          setAppState((previousState) => ({
            ...previousState,
            repository: apiData.data
          }));
        });
      handleClose();
    }
    setValidated(true);
  };

  /*   then((response: any) => {
        document.getElementById("zipfilesucessalert").classList.add("show");
    }).catch().finally(() => {
        setTimeout(() => {
            document.getElementById("zipfilesucessalert").classList.remove("show");
        }, 3000);
    });  */

  
  let removeAllFiles = () => {
    setTmpAcceptedFiles(new Map<string, File>());
  }

  return (
    <>
      <Button variant="primary" className="w-100" onClick={handleShow}>New Commit</Button>

      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        size='xl'
        className="no-user-select"
      >
        <Modal.Header closeButton>
          <Modal.Title>New Commit</Modal.Title>
        </Modal.Header>
        <Form validated={validated} onSubmit={handleSubmit}>
          <Modal.Body>
            <Row className="mb-3" {...getRootProps()} >
              <input {...getInputProps()} />
              <Col className={"mx-2 d-flex rounded align-items-center align-content-center justify-content-around drop-zone " + (isDragActive ? "drop-zone-active" : "")}                                     >
                {
                  isDragActive ?
                    <p className="m-0">Drop the files here ...</p> :
                    <p className="m-0">Drag 'n' drop some files or folders here, or click to select files</p>
                }
              </Col>
            </Row>
            <Row style={{ minHeight: "45vh" }}>
              <Col xs={6}>
                <Row>
                  <Col xs={8}><h4 className="mb-0">Files</h4></Col>
                  <Col xs={4}>
                    {(tmpAcceptedFiles.size === 0) ?
                      <Button variant='light' style={{ width: '100%' }} size='sm' disabled>no Files selected</Button> :
                      <Button variant='danger' style={{ width: '100%' }} size='sm' onClick={removeAllFiles} disabled={tmpAcceptedFiles.size < 1}>Remove all files</Button>}
                  </Col>
                </Row>
                <Row className="mb-2">
                  <Form.Group>
                    <Form.Control isInvalid={tmpAcceptedFiles.size === 0} isValid={tmpAcceptedFiles.size > 0} type="hidden" />
                    <Form.Control.Feedback type="valid">Looks good!</Form.Control.Feedback>
                    <Form.Control.Feedback type="invalid">At least one File needs to be selected!</Form.Control.Feedback>
                  </Form.Group>
                </Row>
                <Row>
                  <FileTreeView files={tmpAcceptedFiles} onChange={files => setChoosenFiles(files)} />
                </Row>
              </Col>
              <Col xs={6}>
                <Row>
                  <Col xs={8}><h4 className="mb-0">Features</h4></Col>
                  <Col xs={4}>
                    {(configFile == null) ?
                      <Button variant='light' style={{ width: '100%' }} size='sm' disabled>.config not found</Button> :
                      <Button variant='danger' style={{ width: '100%' }} size='sm' onClick={() => setConfigFile(undefined)} disabled={configFile == null}>Remove Config File</Button>}
                  </Col>
                </Row>
                <FeatureColumn configFile={configFile} setConfigString={setConfigString} />
              </Col>
            </Row >
            <Form.Group className="mb-1" key={3}>
              <Form.Label>Configuration</Form.Label>
              <Form.Control type="text" disabled value={configString} readOnly />
            </Form.Group>
            <Form.Group>
              <Form.Control as="textarea" required rows={1} type="text" placeholder="Commit Message" value={commitMessage} onChange={e => setCommitMessage(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Col className="d-flex justify-content-between align-items-center">
              <Button variant="secondary" onClick={onModalDismiss}>Close</Button>
              <Button variant="primary" type="submit">Commit</Button>
            </Col>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}