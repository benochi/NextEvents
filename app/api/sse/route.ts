// File: app/api/sse/route.ts

import { NextRequest, NextResponse } from 'next/server';

const connections = new Map<string, ReadableStreamDefaultController[]>();

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  if (!connections.has(userId)) {
    connections.set(userId, []);
  }

  const stream = new ReadableStream({
    start(controller) {
      connections.get(userId)?.push(controller);
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ message: 'Connected successfully' })}\n\n`));

      req.signal.addEventListener('abort', () => {
        // Remove the controller when the connection is closed
        const userControllers = connections.get(userId);
        if (userControllers) {
          connections.set(userId, userControllers.filter((c) => c !== controller));
        }
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, message } = await req.json();
    if (!userId || !message) {
      return NextResponse.json({ error: "User ID and message are required" }, { status: 400 });
    }

    const userControllers = connections.get(userId);
    if (!userControllers || userControllers.length === 0) {
      return NextResponse.json({ error: "No active connection found for user" }, { status: 404 });
    }

    // Send the message to all active controllers for the user
    userControllers.forEach((controller) => {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ message })}\n\n`));
    });

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error handling POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
