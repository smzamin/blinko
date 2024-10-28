import { useDropzone } from "react-dropzone";
import { FileUploadIcon } from "../Icons";
import { Button } from "@nextui-org/react";
import { Icon } from "@iconify/react";
type IProps = {
  onUpload?: ({ filePath, fileName }) => void
}
export const UploadFileWrapper = ({ onUpload }: IProps) => {
  const {
    getRootProps,
    getInputProps,
    open
  } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: async acceptedFiles => {
      const file = acceptedFiles[0]!
      const formData = new FormData();
      formData.append('file', file)
      const response = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      onUpload?.(data)
    }
  });

  return <div {...getRootProps()}>
    <input {...getInputProps()} />
    <Button onClick={open} color='primary' startContent={<Icon icon="tabler:upload" width="24" height="24" />}>Upload</Button>
  </div>
}