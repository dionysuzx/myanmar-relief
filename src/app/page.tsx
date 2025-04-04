import type { Metadata } from "next";
import App from "./app";

const appUrl = process.env.NEXT_PUBLIC_URL;

// frame preview metadata
const appName = process.env.NEXT_PUBLIC_FRAME_NAME;
const splashImageUrl = `${appUrl}/splash.png`;
const iconUrl = `${appUrl}/icon.png`;

const framePreviewMetadata = {
  version: "next",
  imageUrl: `${appUrl}/images/frame-preview.png`,
  button: {
    title: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT || "🚀 Start",
    action: {
      type: "launch_frame",
      name: appName,
      url: appUrl,
      splashImageUrl,
      iconUrl,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

// No need for revalidate since we're using a static image
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: appName,
    openGraph: {
      title: appName,
      description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION,
    },
    other: {
      "fc:frame": JSON.stringify(framePreviewMetadata),
    },
  };
}

export default function Home() {
  return (<App />);
}
