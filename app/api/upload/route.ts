import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * POST /api/upload
 * Upload image to Firebase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000000);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomNum}.${extension}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, `incidents/${filename}`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`📤 Uploading image: ${filename} (${(file.size / 1024).toFixed(2)} KB)`);

    await uploadBytes(storageRef, buffer, {
      contentType: file.type
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    console.log('✅ Upload successful:', downloadURL);

    return NextResponse.json({
      success: true,
      url: downloadURL,
      filename: filename
    });

  } catch (error: any) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'upload-api',
    storage: storage ? 'connected' : 'disconnected'
  });
}
