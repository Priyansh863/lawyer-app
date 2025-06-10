import { getSignedUrl } from "@/services/user";
import imageCompression from "browser-image-compression";


/**
 * Uploading file to presignedUrl
 * @param signedUrl
 * @param file
 * @returns
 */
export const pushFileToS3 = async (signedUrl: string, file: Blob): Promise<Response> => {
    const myHeaders = new Headers({
        "Content-Type": file.type,
        "Access-Control-Allow-Origin": "*",
    });
    return fetch(signedUrl, {
        method: "PUT",
        headers: myHeaders,
        body: file,
    });
};

/**
 * Generating File URL
 * @param file
 * @param filePath
 * @param getSignedUrl
 * @returns
 */
export const uploadFileOnS3 = async (
    file: Blob,
    filePath: string,
): Promise<string | undefined> => {
    const body: { filePath: string; fileFormat: string } = {
        filePath: filePath,
        fileFormat: file.type as string,
    };

    let signedUrl;
    const presignedUrl = await getSignedUrl(body);
    if (presignedUrl && presignedUrl.data) {
        const response = await pushFileToS3(presignedUrl.data.data as string, file);
        if (response?.url) {
            signedUrl = response?.url.split("?")?.[0];
        }
    }
    return signedUrl;
};

 /**
   * getting upload file url  all Notifications
   */
 export const getUploadFileUrl = async (userId: string, item:any) => {
    const filePath = `ai-lawyer-development-assets/${new Date().getTime()}-${userId}.${
      item.format
    }`;
    const imgBlob = await imageCompression.getFilefromDataUrl(
      item.data as string,
      `${Date.now()}.${item.format}`
    );
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    const compressedImage = await imageCompression(imgBlob, options);
    const fileUrl = (await uploadFileOnS3(
      compressedImage,
      filePath
    )) as string;
    return fileUrl;
  };