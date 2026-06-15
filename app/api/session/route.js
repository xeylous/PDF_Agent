import { NextResponse } from 'next/server';
import { deleteSessionById } from '@/lib/db.js';

/**
 * DELETE /api/session
 * Deletes an active PDF session and its chunks/embeddings (via CASCADE) from Neon DB.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId parameter.' }, { status: 400 });
    }

    await deleteSessionById(sessionId);

    return NextResponse.json({
      success: true,
      message: `Session ${sessionId} and all associated embeddings deleted from database.`,
    });
  } catch (err) {
    console.error('[/api/session] DELETE Error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Failed to delete session embeddings from database.' },
      { status: 500 }
    );
  }
}
