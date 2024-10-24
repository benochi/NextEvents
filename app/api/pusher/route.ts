import Pusher from "pusher";
import { NextRequest, NextResponse } from "next/server";

// Configure Pusher
const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const { userId, message } = await req.json();
    if (!userId || !message) {
      return NextResponse.json({ error: "UserId and message are required" }, { status: 400 });
    }

    // Trigger a Pusher event to the user-specific channel
    await pusher.trigger(`private-user-${userId}`, "message-event", {
      message,
    });

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error handling POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
