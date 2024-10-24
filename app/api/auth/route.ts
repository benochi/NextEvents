import Pusher from "pusher";
import { NextRequest, NextResponse } from "next/server";

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    // Get the socket_id and channel_name from the form data
    const socket_id = formData.get('socket_id') as string;
    const channel_name = formData.get('channel_name') as string;

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: "socket_id and channel_name are required" },
        { status: 400 }
      );
    }

    // Verify this is a private channel
    if (!channel_name.startsWith('private-')) {
      return NextResponse.json(
        { error: "Invalid channel type" },
        { status: 403 }
      );
    }

    // Generate auth signature
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);

    // Return the auth response
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Error in auth endpoint:", error);
    return NextResponse.json(
      { error: "Error generating channel auth signature" },
      { status: 500 }
    );
  }
}