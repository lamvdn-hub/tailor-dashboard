import { supabase } from './supabase';

export async function testStorageBucket(bucketName: string = 'session_photos'): Promise<{
  success: boolean;
  errors: string[];
  details: Record<string, unknown>;
}> {
  const errors: string[] = [];
  const details: Record<string, unknown> = {};

  console.log(`Testing storage bucket: ${bucketName}`);

  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      errors.push(`Failed to list buckets: ${bucketsError.message}`);
      details.bucketsError = bucketsError;
      return { success: false, errors, details };
    }

    console.log('Available buckets:', buckets);
    details.availableBuckets = buckets?.map(b => b.name);

    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (!bucketExists) {
      errors.push(`Bucket '${bucketName}' does not exist`);
      return { success: false, errors, details };
    }

    console.log(`Bucket '${bucketName}' exists`);

    const testFileName = `test/${Date.now()}.txt`;
    const testContent = new Blob(['test'], { type: 'text/plain' });

    console.log('Testing upload permission...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testContent);

    if (uploadError) {
      errors.push(`Upload test failed: ${uploadError.message}`);
      details.uploadError = uploadError;
      return { success: false, errors, details };
    }

    console.log('Upload test successful:', uploadData);
    details.uploadTest = 'success';

    console.log('Testing read permission...');
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFileName);

    console.log('Public URL generated:', urlData.publicUrl);
    details.publicUrl = urlData.publicUrl;

    console.log('Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFileName]);

    if (deleteError) {
      console.warn('Failed to delete test file:', deleteError);
      details.deleteWarning = deleteError.message;
    } else {
      console.log('Test file deleted successfully');
    }

    return {
      success: true,
      errors: [],
      details: {
        ...details,
        message: 'All storage tests passed successfully',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Unexpected error: ${errorMessage}`);
    details.exception = error;
    return { success: false, errors, details };
  }
}

export async function debugPhotoUpload(
  sessionId: string,
  photoFile: Blob,
  thumbnailFile: Blob,
  userId: string
): Promise<{
  success: boolean;
  errors: string[];
  uploadedPaths?: { filePath: string; thumbPath: string };
}> {
  const errors: string[] = [];

  try {
    console.log('Debug: Starting photo upload test...');
    console.log('Session ID:', sessionId);
    console.log('Photo file size:', photoFile.size);
    console.log('Thumbnail file size:', thumbnailFile.size);
    console.log('User ID:', userId);

    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const filePath = `${sessionId}/${timestamp}_${randomId}.jpg`;
    const thumbPath = `${sessionId}/thumb_${timestamp}_${randomId}.jpg`;

    console.log('Uploading full-size image to:', filePath);
    const { data: fileData, error: fileError } = await supabase.storage
      .from('session_photos')
      .upload(filePath, photoFile, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (fileError) {
      errors.push(`Full-size upload failed: ${fileError.message}`);
      console.error('File upload error:', fileError);
      return { success: false, errors };
    }

    console.log('Full-size upload successful:', fileData);

    console.log('Uploading thumbnail to:', thumbPath);
    const { data: thumbData, error: thumbError } = await supabase.storage
      .from('session_photos')
      .upload(thumbPath, thumbnailFile, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (thumbError) {
      errors.push(`Thumbnail upload failed: ${thumbError.message}`);
      console.error('Thumbnail upload error:', thumbError);
      return { success: false, errors };
    }

    console.log('Thumbnail upload successful:', thumbData);

    console.log('Saving metadata to database...');
    const { data: metadataData, error: metadataError } = await supabase
      .from('session_photos')
      .insert({
        session_id: sessionId,
        file_path: filePath,
        thumbnail_path: thumbPath,
        file_size: photoFile.size,
        uploaded_by: userId,
      })
      .select();

    if (metadataError) {
      errors.push(`Metadata save failed: ${metadataError.message}`);
      console.error('Metadata error:', metadataError);
      return { success: false, errors };
    }

    console.log('Metadata saved successfully:', metadataData);

    return {
      success: true,
      errors: [],
      uploadedPaths: { filePath, thumbPath },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Unexpected error: ${errorMessage}`);
    console.error('Debug upload exception:', error);
    return { success: false, errors };
  }
}
