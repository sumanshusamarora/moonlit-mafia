import { getApps } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";

let storage: FirebaseStorage | undefined;

export const getFirebaseStorage = () => {
  if (storage) {
    return storage;
  }
  const app = getApps()[0];
  if (!app) {
    throw new Error("Firebase app not initialized");
  }
  storage = getStorage(app);
  return storage;
};

export const uploadVoiceMessage = async (
  gameId: string,
  userId: string,
  audioBlob: Blob
): Promise<{ url: string; duration: number }> => {
  try {
    const storageInstance = getFirebaseStorage();
    const timestamp = Date.now();
    const fileName = `voice-messages/${gameId}/${userId}-${timestamp}.webm`;
    const storageRef = ref(storageInstance, fileName);

    // Upload the audio blob
    await uploadBytes(storageRef, audioBlob, {
      contentType: "audio/webm",
    });

    // Get the download URL
    const url = await getDownloadURL(storageRef);

    // Calculate duration from blob
    const duration = await getAudioDuration(audioBlob);

    return { url, duration };
  } catch (error: any) {
    if (error?.code === "storage/unauthorized") {
      throw new Error(
        "Storage permission denied. Please ensure Firebase Storage rules are deployed. " +
        "Go to Firebase Console > Storage > Rules and publish the rules from storage.rules file."
      );
    }
    throw error;
  }
};

const getAudioDuration = (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(blob);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.round(audio.duration));
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load audio metadata"));
    });

    audio.src = objectUrl;
  });
};
