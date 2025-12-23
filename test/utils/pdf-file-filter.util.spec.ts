import { BadRequestException } from '@nestjs/common';
import { pdfFileFilter } from '../../src/utils/pdf-file-filter.util';

describe('pdfFileFilter', () => {
  it('should accept PDF files', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    pdfFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeNull();
      expect(accept).toBe(true);
      done();
    });
  });

  it('should reject non-PDF files', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    pdfFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error?.message).toBe('Only PDF files are allowed!');
      expect(accept).toBe(false);
      done();
    });
  });

  it('should reject image/png files', (done) => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake'),
      size: 1024,
    } as Express.Multer.File;

    pdfFileFilter(null, mockFile, (error, accept) => {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(accept).toBe(false);
      done();
    });
  });
});