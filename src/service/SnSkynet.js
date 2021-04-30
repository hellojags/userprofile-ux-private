import { SkynetClient} from "skynet-js"

const skynetClient = new SkynetClient("https://siasky.net");

// this method will upload content and return skylink
export const uploadFile = async (file) => {
  try {
    const md = await skynetClient.uploadFile(file);
    return md;
  } catch (error) {
    console.log(error);
    return null;
  }
}
