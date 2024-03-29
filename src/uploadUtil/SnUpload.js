import Grid from "@material-ui/core/Grid";
import Snackbar from "@material-ui/core/Snackbar";
// import "./sn.upload.scss";
import MuiAlert from "@material-ui/lab/Alert";
import bytes from "bytes";
import HttpStatus from "http-status-codes";
import path from "path-browserify";
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { BsFileEarmarkArrowUp } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { SkynetClient } from "skynet-js";
import { setUploadList } from "../redux/action-reducers-epic/SnUploadListAction";
import {
  generateThumbnailFromVideo,
  getCompressedImageFile,
  hashFromSkylinkUploadResponse,
} from "../utils/SnUtility";
import UploadFile from "./UploadFile";
const portal =
  window.location.hostname === 'localhost' ? 'https://siasky.net' : undefined;
function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const SnUpload = React.forwardRef((props, ref) => {
  const dispatch = useDispatch();

  const [files, setFiles] = useState([]);
  const [uploadErr, setUploadErr] = useState(false);
  const [isDir] = useState(false);
  const snUploadListStore = useSelector((state) => state.snUploadListStore);
  const gridRef = useRef();
  const client = new SkynetClient(portal);
  
  

  useEffect(() => {
    const setFileToStore = () => {
      if (props.source) {
        snUploadListStore[props.source] = files;
        dispatch(setUploadList(snUploadListStore));
      }
    };
    setFileToStore();
    props.onUploadProgress && props.onUploadProgress(files);
  }, [files,props,dispatch,snUploadListStore]);

  const getFilePath = (file) =>
    file.webkitRelativePath || file.path || file.name;

  const getRelativeFilePath = (file) => {
    const filePath = getFilePath(file);
    const { root, dir, base } = path.parse(filePath);
    const relative = path
      .normalize(dir)
      .slice(root.length)
      .split(path.sep)
      .slice(1);

    return path.join(...relative, base);
  };

  const getRootDirectory = (file) => {
    const filePath = getFilePath(file);
    const { root, dir } = path.parse(filePath);

    return path.normalize(dir).slice(root.length).split(path.sep)[0];
  };

  const createUploadErrorMessage = (error) => {
    // The request was made and the server responded with a status code that falls out of the range of 2xx
    if (error.response) {
      if (error.response.data.message) {
        return `Upload failed with error: ${error.response.data.message}`;
      }

      const statusCode = error.response.status;
      const statusText = HttpStatus.getStatusText(error.response.status);

      return `Upload failed, our server received your request but failed with status code: ${statusCode} ${statusText}`;
    }

    // The request was made but no response was received. The best we can do is detect whether browser is online.
    // This will be triggered mostly if the server is offline or misconfigured and doesn't respond to valid request.
    if (error.request) {
      if (!navigator.onLine) {
        return "You are offline, please connect to the internet and try again";
      }

      // TODO: We should add a note "our team has been notified" and have some kind of notification with this error.
      return "Server failed to respond to your request, please try again later.";
    }

    // TODO: We should add a note "our team has been notified" and have some kind of notification with this error.
    return `Critical error, please refresh the application and try again. ${error.message}`;
  };

  const handleDrop = async (acceptedFiles) => {
    // if (props.uploadStarted) {
    props.uploadStarted && props.uploadStarted(true);
    // }
    if ((props.directoryMode || isDir) && acceptedFiles.length) {
      const rootDir = getRootDirectory(acceptedFiles[0]); // get the file path from the first file

      acceptedFiles = [
        { name: rootDir, directory: true, files: acceptedFiles },
      ];
    }

    setFiles((previousFiles) => [
      ...acceptedFiles.map((file) => ({ file, status: "uploading" })),
      ...previousFiles,
    ]);

    const onFileStateChange = (file, state) => {
      setFiles((previousFiles) => {
        const index = previousFiles.findIndex((f) => f.file === file);
        return [
          ...previousFiles.slice(0, index),
          {
            ...previousFiles[index],
            ...state,
          },
          ...previousFiles.slice(index + 1),
        ];
      });
    };

    await acceptedFiles.reduce(async (memo, file) => {
      await memo;
      // Reject files larger than our hard limit of 1 GB with proper message
      if (file.size > bytes("1 GB")) {
        onFileStateChange(file, {
          status: "error",
          error: "This file size exceeds the maximum allowed size of 1 GB.",
        });

        return;
      }
      props.onUploadStart && props.onUploadStart();
      const fileType = file.type;
      let resForCompressed;
      if (fileType && fileType.startsWith("image")) {
        const compressedFile = await getCompressedImageFile(file);
        resForCompressed = await client.uploadFile(compressedFile);
      }
      if (fileType && fileType.startsWith("video")) {
        const videoThumbnail = await generateThumbnailFromVideo({ file });
        resForCompressed = await client.uploadFile(videoThumbnail);
      }
      const onUploadProgress = (progress) => {
        const status = progress === 1 ? "processing" : "uploading";
        onFileStateChange(file, { status, progress });
      };

      const upload = async () => {
        try {
          let response;
          if (file.directory) {
            const directory = file.files.reduce((accumulator, file) => {
              const path = getRelativeFilePath(file);

              return { ...accumulator, [path]: file };
            }, {});

            response = await client.uploadDirectory(
              directory,
              getRootDirectory(file.files[0]),
              { onUploadProgress }
            );
          } else {
            response = await client.uploadFile(file, { onUploadProgress });
          }
          await props.onUpload({
            skylink: hashFromSkylinkUploadResponse(response),
            name: file.name,
            contentType: fileType,
            thumbnail:
              resForCompressed != null
                ? hashFromSkylinkUploadResponse(resForCompressed)
                : null,
            contentLength: file.size,
          });
          onFileStateChange(file, {
            status: "complete",
            url: await client.getSkylinkUrl(
              hashFromSkylinkUploadResponse(response)
            ),
          });
          props.onUploadEnd && props.onUploadEnd();
          //send event to parent
        } catch (error) {
          props.uploadStarted && props.uploadStarted(true);

          if (
            error.response &&
            error.response.status === HttpStatus.TOO_MANY_REQUESTS
          ) {
            onFileStateChange(file, { progress: -1 });

            return new Promise((resolve) =>
              setTimeout(() => resolve(upload()), 3000)
            );
          }
          onFileStateChange(file, {
            status: "error",
            error: createUploadErrorMessage(error),
          });
          setUploadErr(true);
          props.onUploadEnd && props.onUploadEnd();
        }
      };
      await upload();
    }, undefined);
  };
  const { getRootProps, getInputProps, inputRef } = useDropzone({
    onDrop: handleDrop,
  });
  useImperativeHandle(ref, () => ({
    handleDrop,
    gridRef,
  }));
  useEffect(() => {
    if (props.directoryMode || isDir) {
      inputRef.current.setAttribute("webkitdirectory", "true");
    } else {
      inputRef.current.removeAttribute("webkitdirectory");
    }
  }, [props.directoryMode,inputRef, isDir]);
  return (
    <React.Fragment>
      <div className="">
        {/* <div
               className={classNames("home-upload-dropzone", {
                "drop-active": isDragActive,
              })}
              {...getRootProps()}
              ref={gridRef}
            > */}
        {/* <span className="home-upload-text">
                <h3>
                  <CloudUploadOutlinedIcon /> Upload your {(props.directoryMode || isDir) ? "Directory" : "Files"}
                </h3>
              </span> */}
        <div
          container
          spacing={3}
          className="drpZone_main_grid"
          {...getRootProps()}
          ref={gridRef}
        >
          <Grid item xs={12} className="MuiDropzoneArea-root">
            <div style={{ paddingTop: "20px", paddingBottom: "20px" }}>
              <div>
                <BsFileEarmarkArrowUp
                  style={{
                    fontSize: "55px",
                    color: "#c5c5c5",
                    marginBottom: "10px",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#c5c5c5",
                }}
              >
                Drop a {props.directoryMode || isDir ? "directory" : "file"}{" "}
                here or
                <span style={{ color: "#1ed660", marginLeft: "3px" }}>
                  click here to upload
                </span>
              </span>
            </div>
          </Grid>
        </div>
        {/* </div> */}
        <input id="idInp" {...getInputProps()} className="offscreen" />
      </div>
      {files.length > 0 && (
        <div className="home-uploaded-files d-none">
          {files.map((file, i) => {
            return <UploadFile key={i} {...file} />;
          })}
        </div>
      )}
      <Snackbar
        open={uploadErr}
        autoHideDuration={4000}
        onClose={() => setUploadErr(false)}
      >
        <Alert onClose={() => setUploadErr(false)} severity="error">
          Error on upload!
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
});

export default SnUpload;
