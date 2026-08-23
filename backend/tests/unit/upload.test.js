import { describe, it, expect } from 'vitest';
import { fileFilter } from '../../src/config/upload.js';

function attempt(filename) {
  return new Promise((resolve) => {
    fileFilter({}, { originalname: filename }, (err, accepted) => resolve({ err, accepted }));
  });
}

describe('upload fileFilter', () => {
  it.each(['doc.pdf', 'photo.PNG', 'scan.Jpg', 'shot.jpeg'])('accepts %s', async (name) => {
    const { err, accepted } = await attempt(name);
    expect(err).toBeNull();
    expect(accepted).toBe(true);
  });

  it.each(['malware.exe', 'no-extension', 'archive.zip', 'notes.txt'])('rejects %s', async (name) => {
    const { err, accepted } = await attempt(name);
    expect(accepted).toBeUndefined(); // multer convention: error passed via cb
    expect(err.message).toBe('File type not allowed');
  });
});
