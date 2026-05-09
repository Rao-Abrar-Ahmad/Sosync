import { storage } from '@/config/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Upload a local file to Firebase Storage and return its download URL
 * @param uri Local file URI
 * @param path Storage path (e.g. 'reports/user123/image.jpg')
 * @returns Promise that resolves to the download URL
 */
export async function uploadMedia(uri: string, path: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Wait for the upload to complete
    await uploadTask;
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}
