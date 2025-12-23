import { imageFileFilter } from '../../src/utils/image-file-filter.util';

describe('imageFileFilter', () => {
  it('should accept image/jpeg files', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'photo.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    imageFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeNull();
      expect(accept).toBe(true);
      done();
    });
  });

  it('should accept image/png files', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'photo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    imageFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeNull();
      expect(accept).toBe(true);
      done();
    });
  });

  it('should accept image/gif files', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'photo.gif',
      encoding: '7bit',
      mimetype: 'image/gif',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    imageFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeNull();
      expect(accept).toBe(true);
      done();
    });
  });

  it('should reject non-image files (PDF)', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    imageFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Only image files are allowed!');
      expect(accept).toBe(false);
      done();
    });
  });

  it('should reject non-image files (text)', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'file.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    imageFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeInstanceOf(Error);
      expect(accept).toBe(false);
      done();
    });
  });

  it('should reject video files', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'video.mp4',
      encoding: '7bit',
      mimetype: 'video/mp4',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    imageFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeInstanceOf(Error);
      expect(accept).toBe(false);
      done();
    });
  });
});