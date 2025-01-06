import "./FileDropZone.css";
import { Pane, toaster } from "evergreen-ui";
import { useCallback, useState, useEffect } from "react";
import classNames from "classnames";

type FileDropZoneProps = {
  children: React.ReactNode;
  fileNameAllowList: string[];
  onDrop: (file: File) => void;
};

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "disjunction",
});

export function FileDropZone({
  children,
  fileNameAllowList,
  onDrop,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleWindowDragEnter = () => {
      setIsDragging(true);
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    return () => window.removeEventListener("dragenter", handleWindowDragEnter);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [setIsDragging]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const [file] = e.dataTransfer.files;
      if (!file) {
        return;
      }

      if (!fileNameAllowList.includes(file.name)) {
        toaster.warning(
          `File names must match ${formatter.format(fileNameAllowList)}`
        );
        return;
      }

      onDrop(file);
    },
    [setIsDragging]
  );

  return (
    <Pane className="FileDropZone-container">
      {children}

      {isDragging && (
        <>
          <Pane
            className={classNames("FileDropZone-overlay", {
              dragging: isDragging,
            })}
          />
          <Pane
            className="FileDropZone-dropZone"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </>
      )}
    </Pane>
  );
}
